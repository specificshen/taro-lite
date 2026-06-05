import path from 'node:path';

import { resolveMainFilePath, swc } from '@spcsn/taro-helper';

import { appendVirtualModulePrefix, escapePath, prettyPrintJson, stripVirtualModulePrefix } from '../utils';
import { createFilterWithCompileOptions } from '../utils/create-filter';
import { UniqueKeyMap } from '../utils/map';

import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { PluginOption, ResolvedConfig } from 'vite';

export const PAGE_SUFFIX = '?page-loader=true';
const nativeComponentMapCache = new WeakMap<ResolvedConfig, Map<string, Record<string, string>>>();
const nativeUniqueKeyMap = new WeakMap<ResolvedConfig, UniqueKeyMap<string>>();
const importNativeComponentName = 'importNativeComponent';
const defineConfigNames = new Set(['defineAppConfig', 'definePageConfig']);

interface SourceSpan {
  start: number;
  end: number;
}

interface SwcNode {
  type?: string;
  span?: SourceSpan;
  [key: string]: unknown;
}

interface SourceEdit {
  start: number;
  end: number;
  value: string;
}

interface NativeComponentTransformResult {
  code: string;
  enableImportComponent: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSwcNode(value: unknown): value is SwcNode {
  return isRecord(value) && typeof value.type === 'string';
}

function getIdentifierValue(node: unknown): string | undefined {
  if (!isSwcNode(node) || node.type !== 'Identifier') return;
  return typeof node.value === 'string' ? node.value : undefined;
}

function getStringLiteralValue(node: unknown): string | undefined {
  if (!isSwcNode(node) || node.type !== 'StringLiteral') return;
  return typeof node.value === 'string' ? node.value : undefined;
}

function getSourceRange(span: SourceSpan): Pick<SourceEdit, 'start' | 'end'> {
  return {
    start: span.start - 1,
    end: span.end - 1,
  };
}

function collectSwcNodes(node: unknown, visitor: (node: SwcNode) => void) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectSwcNodes(item, visitor));
    return;
  }

  if (!isRecord(node)) return;

  if (isSwcNode(node)) {
    visitor(node);
  }

  Object.entries(node).forEach(([key, value]) => {
    if (key === 'span') return;
    collectSwcNodes(value, visitor);
  });
}

function hasLocalImportNativeComponent(ast: SwcNode): boolean {
  let hasLocalBinding = false;

  collectSwcNodes(ast, (node) => {
    if (hasLocalBinding) return;

    if (node.type === 'FunctionDeclaration') {
      hasLocalBinding = getIdentifierValue(node.identifier) === importNativeComponentName;
      return;
    }

    if (node.type === 'VariableDeclarator') {
      hasLocalBinding = getIdentifierValue(node.id) === importNativeComponentName;
      return;
    }

    if (node.type === 'ImportDeclaration') {
      const specifiers = Array.isArray(node.specifiers) ? node.specifiers : [];
      hasLocalBinding = specifiers.some((specifier) => {
        if (!isSwcNode(specifier)) return false;
        return getIdentifierValue(specifier.local) === importNativeComponentName;
      });
    }
  });

  return hasLocalBinding;
}

function transformNativeComponents(
  code: string,
  id: string,
  viteCompilerContext: ViteMiniCompilerContext,
  nCompUniqueKeyMap: UniqueKeyMap<string>,
  scopeNativeComp: Map<string, string>,
): NativeComponentTransformResult {
  const ast = swc.parseSync(code, {
    syntax: 'typescript',
    tsx: true,
  }) as unknown as SwcNode;

  if (hasLocalImportNativeComponent(ast)) {
    return {
      code,
      enableImportComponent: false,
    };
  }

  const sourceEdits: SourceEdit[] = [];

  collectSwcNodes(ast, (node) => {
    if (!node.span || node.type !== 'CallExpression') return;
    const calleeName = getIdentifierValue(node.callee);

    if (defineConfigNames.has(calleeName || '') && /\.config\.(t|j)sx?$/.test(id)) {
      sourceEdits.push({
        ...getSourceRange(node.span),
        value: '',
      });
      return;
    }

    if (calleeName !== importNativeComponentName) return;

    const callArguments = Array.isArray(node.arguments) ? node.arguments : [];
    const pathArg = isRecord(callArguments[0]) ? callArguments[0].expression : undefined;
    const nameArg = isRecord(callArguments[1]) ? callArguments[1].expression : undefined;
    const exportNameArg = isRecord(callArguments[2]) ? callArguments[2].expression : undefined;
    let nativeComponentPath = viteCompilerContext.resolvePageImportPath(
      id,
      getStringLiteralValue(pathArg) || '',
    );

    if (nativeComponentPath.startsWith('.')) {
      nativeComponentPath = path.resolve(path.dirname(id), nativeComponentPath);
    }

    nativeComponentPath = resolveMainFilePath(nativeComponentPath);
    const componentName = getStringLiteralValue(nameArg) || '';
    const exportName = getStringLiteralValue(exportNameArg) || 'default';
    let key = `${componentName}${exportName !== 'default' ? `_${exportName}` : ''}`.toLowerCase();
    key = nCompUniqueKeyMap.add(key, nativeComponentPath);
    scopeNativeComp.set(key, nativeComponentPath);

    sourceEdits.push({
      ...getSourceRange(node.span),
      value: JSON.stringify(key),
    });
  });

  const transformedCode = sourceEdits
    .sort((leftEdit, rightEdit) => rightEdit.start - leftEdit.start)
    .reduce((result, edit) => result.slice(0, edit.start) + edit.value + result.slice(edit.end), code);

  return {
    code: transformedCode,
    enableImportComponent: true,
  };
}

export default function (viteCompilerContext: ViteMiniCompilerContext): PluginOption {
  const { taroConfig, sourceDir } = viteCompilerContext;
  const filter = createFilterWithCompileOptions(taroConfig.compile, [sourceDir, /(?<=node_modules[\\/]).*taro/], []);

  let viteConfig: ResolvedConfig;
  let nCompCache: Map<string, Record<string, string>>;
  let nCompUniqueKeyMap: UniqueKeyMap<string>;

  return {
    name: 'taro:vite-mini-page',
    enforce: 'pre',
    configResolved(config) {
      viteConfig = config;
    },
    buildStart() {
      if (nativeComponentMapCache.has(viteConfig)) {
        nCompCache = nativeComponentMapCache.get(viteConfig)!;
        nCompUniqueKeyMap = nativeUniqueKeyMap.get(viteConfig)!;
      } else {
        nCompCache = new Map<string, Record<string, string>>();
        nativeComponentMapCache.set(viteConfig, nCompCache);
        nCompUniqueKeyMap = new UniqueKeyMap<string>();
        nativeUniqueKeyMap.set(viteConfig, nCompUniqueKeyMap);
      }
    },
    resolveId(source, _importer, options) {
      if (viteCompilerContext?.isPage(source) && options.isEntry) {
        if (viteCompilerContext.getPageById(source)?.isNative) return null;
        return appendVirtualModulePrefix(source + PAGE_SUFFIX);
      }
      return null;
    },
    load(id) {
      if (viteCompilerContext && id.endsWith(PAGE_SUFFIX)) {
        const rawId = stripVirtualModulePrefix(id).replace(PAGE_SUFFIX, '');
        const page = viteCompilerContext.getPageById(rawId);

        if (!page) {
          viteCompilerContext.logger.warn(`编译页面 ${rawId} 失败!`);
          process.exit(1);
        }

        const pageConfig = prettyPrintJson(page.config);

        let instantiatePage = `var inst = Page(createPageConfig(component, '${page.name}', {root:{cn:[]}}, config || {}))`;

        if (typeof viteCompilerContext.loaderMeta.modifyInstantiate === 'function') {
          instantiatePage = viteCompilerContext.loaderMeta.modifyInstantiate(instantiatePage, 'page');
        }

        viteCompilerContext.collectedDeps(this, escapePath(rawId), filter).then((deps) => {
          const ncObj: Record<string, string> = {};
          deps.forEach((dep) => {
            Object.entries(nCompCache.get(dep) || {}).forEach(([key, value]) => {
              const absPath = value;
              const ext = path.extname(absPath);
              const basename = path.basename(absPath, ext);
              ncObj[key] = path.join(path.dirname(path.relative(path.dirname(rawId), absPath)), basename);
            });
          });
          if (!page.isNative) {
            page.config.usingComponents = {
              ...page.config.usingComponents,
              ...ncObj,
            };
          }
          const nativeComps = viteCompilerContext.collectNativeComponents(page);
          nativeComps.forEach((comp) => {
            viteCompilerContext.generateNativeComponent(this, comp, [rawId]);
          });
        });

        return [
          'import { createPageConfig } from "@spcsn/taro-runtime"',
          `import component from "${escapePath(rawId)}"`,
          `var config = ${pageConfig}`,
          page.config.enableShareTimeline ? 'component.enableShareTimeline = true' : '',
          page.config.enableShareAppMessage ? 'component.enableShareAppMessage = true' : '',
          instantiatePage,
        ].join('\n');
      }
    },
    transform(code, id) {
      if (!/\.m?[jt]sx?$/.test(id) || typeof filter !== 'function' || !filter(id)) return;

      const scopeNativeComp = new Map<string, string>();
      const result = transformNativeComponents(
        code,
        id,
        viteCompilerContext,
        nCompUniqueKeyMap,
        scopeNativeComp,
      );

      if (!result.enableImportComponent) return;

      nCompCache.set(id, Object.fromEntries(scopeNativeComp));
      return {
        code: result.code,
        map: null,
      };
    },
  };
}
