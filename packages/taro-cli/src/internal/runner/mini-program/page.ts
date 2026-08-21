import path from 'node:path';
import { internalComponents, toDashed } from '@spcsn/taro/runtime';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import { type PluginOption, parseAst, type ResolvedConfig } from 'vite';
import { resolveMainFilePath } from '../../helper';
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

interface AstNode {
  type: string;
  start: number;
  end: number;
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

function isAstNode(value: unknown): value is AstNode {
  return isRecord(value) && typeof value.type === 'string';
}

/** oxc（ESTree 兼容）AST 的通用递归遍历，跳过 loc 位置信息 */
function collectAstNodes(node: unknown, visitor: (node: AstNode) => void) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectAstNodes(item, visitor);
    }
    return;
  }

  if (!isRecord(node)) return;

  if (isAstNode(node)) {
    visitor(node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc') continue;
    collectAstNodes(value, visitor);
  }
}

function getIdentifierName(node: unknown): string | undefined {
  if (!isAstNode(node) || node.type !== 'Identifier') return;
  return typeof node.name === 'string' ? node.name : undefined;
}

function getStringLiteralValue(node: unknown): string | undefined {
  if (!isAstNode(node) || node.type !== 'Literal') return;
  return typeof node.value === 'string' ? node.value : undefined;
}

function getJsxElementName(node: unknown): string | undefined {
  if (!isAstNode(node)) return;
  if (node.type === 'JSXIdentifier') {
    return typeof node.name === 'string' ? node.name : undefined;
  }
  if (node.type === 'JSXMemberExpression') {
    // 只收集根对象（如 <Custom.View /> 收集 Custom），跳过非组件节点
    return getJsxElementName(node.object);
  }
}

function collectUsedComponents(ast: AstNode, usedComponents: Set<string>) {
  collectAstNodes(ast, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    const tagName = getJsxElementName(node.name);
    if (tagName && internalComponentNames.has(tagName)) {
      usedComponents.add(toDashed(tagName));
    }
  });
}

function hasLocalImportNativeComponent(ast: AstNode): boolean {
  let hasLocalBinding = false;

  collectAstNodes(ast, (node) => {
    if (hasLocalBinding) return;

    if (node.type === 'FunctionDeclaration' || node.type === 'VariableDeclarator') {
      hasLocalBinding = getIdentifierName(node.id) === importNativeComponentName;
      return;
    }

    if (node.type === 'ImportDeclaration') {
      const specifiers = Array.isArray(node.specifiers) ? node.specifiers : [];
      hasLocalBinding = specifiers.some(
        (specifier) => getIdentifierName((specifier as AstNode).local) === importNativeComponentName,
      );
    }
  });

  return hasLocalBinding;
}

type JsxLang = 'js' | 'jsx' | 'ts' | 'tsx';

function getParseLang(id: string): JsxLang {
  const cleanId = id.split('?')[0].split('#')[0];
  const ext = path.extname(cleanId).toLowerCase();

  switch (ext) {
    case '.ts':
    case '.mts':
    case '.cts':
      return 'ts';
    case '.js':
    case '.mjs':
    case '.cjs':
      return 'js';
    case '.jsx':
      return 'jsx';
    default:
      return 'tsx';
  }
}

export function transformNativeComponents(
  code: string,
  id: string,
  viteCompilerContext: ViteMiniCompilerContext,
  nCompUniqueKeyMap: UniqueKeyMap<string>,
  scopeNativeComp: Map<string, string>,
): NativeComponentTransformResult {
  const ast = parseAst(code, { sourceType: 'module', lang: getParseLang(id) }, id) as unknown as AstNode;

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

  collectAstNodes(ast, (node) => {
    if (node.type !== 'CallExpression') return;
    const calleeName = getIdentifierName(node.callee);

    if (defineConfigNames.has(calleeName || '') && /\.config\.(t|j)sx?$/.test(id)) {
      sourceEdits.push({
        start: node.start,
        end: node.end,
        value: '',
      });
      return;
    }

    if (calleeName !== importNativeComponentName) return;

    const callArguments = Array.isArray(node.arguments) ? node.arguments : [];
    const pathArg = callArguments[0];
    const nameArg = callArguments[1];
    const exportNameArg = callArguments[2];
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
      start: node.start,
      end: node.end,
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
