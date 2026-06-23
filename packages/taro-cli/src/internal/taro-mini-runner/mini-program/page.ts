import path from 'node:path';
import { internalComponents, toDashed } from '@spcsn/taro/runtime';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import type { PluginOption, ResolvedConfig } from 'vite';
import { resolveMainFilePath, swc } from '../../taro-helper';
import { appendVirtualModulePrefix, escapePath, prettyPrintJson, stripVirtualModulePrefix } from '../shared';
import { componentConfig, resetComponentConfigIncludes } from '../shared/component';
import { createFilterWithCompileOptions } from '../shared/create-filter';
import { UniqueKeyMap } from '../shared/map';

export const PAGE_SUFFIX = '?page-loader=true';
const nativeComponentMapCache = new WeakMap<ResolvedConfig, Map<string, Record<string, string>>>();
const nativeUniqueKeyMap = new WeakMap<ResolvedConfig, UniqueKeyMap<string>>();
const importNativeComponentName = 'importNativeComponent';
const defineConfigNames = new Set(['defineAppConfig', 'definePageConfig']);
const internalComponentNames = new Set(Object.keys(internalComponents));

function getJsxElementName(node: SwcNode): string | undefined {
  // SWC represents JSX identifiers as plain Identifier nodes.
  if (node.type === 'Identifier') {
    return typeof node.value === 'string' ? node.value : undefined;
  }
  if (node.type === 'JSXMemberExpression') {
    // Only collect the root object for namespaced usage (e.g. <Custom.View />).
    // This skips collecting non-component nodes while keeping common patterns working.
    return getJsxElementName(node.object as SwcNode);
  }
  return undefined;
}

function collectUsedComponents(node: unknown, usedComponents: Set<string>) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectUsedComponents(item, usedComponents);
    }
    return;
  }
  if (!isSwcNode(node)) return;

  if (node.type === 'JSXElement' || node.type === 'JSXOpeningElement') {
    const nameNode = (node.name || (node as unknown as { opening?: { name: SwcNode } }).opening?.name) as
      | SwcNode
      | undefined;
    const tagName = nameNode ? getJsxElementName(nameNode) : undefined;
    if (tagName && internalComponentNames.has(tagName)) {
      usedComponents.add(toDashed(tagName));
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'span') continue;
    collectUsedComponents(value, usedComponents);
  }
}

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
  usedComponents?: Set<string>;
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
    for (const item of node) {
      collectSwcNodes(item, visitor);
    }
    return;
  }

  if (!isRecord(node)) return;

  if (isSwcNode(node)) {
    visitor(node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'span') continue;
    collectSwcNodes(value, visitor);
  }
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

function getSwcParseOptions(id: string): swc.ParseOptions {
  const cleanId = id.split('?')[0].split('#')[0];
  const ext = path.extname(cleanId).toLowerCase();

  switch (ext) {
    case '.ts':
    case '.mts':
    case '.cts':
      return { syntax: 'typescript', tsx: false };
    case '.tsx':
      return { syntax: 'typescript', tsx: true };
    case '.js':
    case '.mjs':
    case '.cjs':
      return { syntax: 'ecmascript', jsx: false };
    case '.jsx':
      return { syntax: 'ecmascript', jsx: true };
    default:
      return { syntax: 'typescript', tsx: true };
  }
}

function transformNativeComponents(
  code: string,
  id: string,
  viteCompilerContext: ViteMiniCompilerContext,
  nCompUniqueKeyMap: UniqueKeyMap<string>,
  scopeNativeComp: Map<string, string>,
): NativeComponentTransformResult {
  const ast = swc.parseSync(code, getSwcParseOptions(id)) as unknown as SwcNode;

  const usedComponents = new Set<string>();
  collectUsedComponents(ast, usedComponents);

  if (hasLocalImportNativeComponent(ast)) {
    return {
      code,
      enableImportComponent: false,
      usedComponents,
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
    let nativeComponentPath = viteCompilerContext.resolvePageImportPath(id, getStringLiteralValue(pathArg) || '');

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
    usedComponents,
  };
}

export default function (viteCompilerContext: ViteMiniCompilerContext): PluginOption {
  const { taroConfig, sourceDir } = viteCompilerContext;
  const filter = createFilterWithCompileOptions(
    taroConfig.compile,
    [`${sourceDir}/**/*`, /(?<=node_modules[\\/]).*taro/],
    [],
  );

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
      resetComponentConfigIncludes();

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
    async load(id) {
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

        const deps = await viteCompilerContext.collectedDeps(this, escapePath(rawId), filter);
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
        const nativeComps = await viteCompilerContext.collectNativeComponents(page);
        nativeComps.forEach((comp) => {
          viteCompilerContext.generateNativeComponent(this, comp);
        });

        return [
          'import { createPageConfig } from "@spcsn/taro/runtime"',
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
      const result = transformNativeComponents(code, id, viteCompilerContext, nCompUniqueKeyMap, scopeNativeComp);

      if (result.usedComponents?.size) {
        for (const componentName of result.usedComponents) {
          componentConfig.includes.add(componentName);
        }
      }

      if (!result.enableImportComponent) return;

      nCompCache.set(id, Object.fromEntries(scopeNativeComp));
      return {
        code: result.code,
        map: null,
      };
    },
  };
}
