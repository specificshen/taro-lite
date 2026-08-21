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
/** defineAppConfig/definePageConfig 宏擦除只针对 *.config.{ts,tsx,js,jsx} 文件 */
const configFileReg = /\.config\.(t|j)sx?$/;
/** 只有 .jsx/.tsx 会以含 JSX 的 lang 解析（见 getParseLang），才可能从 JSX 收集到组件 */
const jsxFileReg = /\.[jt]sx$/;

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

  // for...in 替代 Object.entries，消除每节点一次的数组分配；
  // oxc AST 节点是无继承可枚举属性的纯对象，for...in 与 Object.entries 遍历结果一致
  for (const key in node) {
    if (key === 'loc') continue;
    collectAstNodes(node[key], visitor);
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
  const pendingCallExpressions: AstNode[] = [];
  let hasLocalBinding = false;

  // 单遍遍历完成三件事：收集 JSX 内使用的内部组件、检测本地 importNativeComponent 绑定、
  // 收集待处理的 CallExpression。注意后者的副作用（宏擦除、组件注册、改写）必须等整棵树
  // 确认无本地绑定后再应用，否则本地绑定存在时仍会误改写，与原三遍遍历的行为不一致。
  collectAstNodes(ast, (node) => {
    switch (node.type) {
      case 'JSXOpeningElement': {
        const tagName = getJsxElementName(node.name);
        if (tagName && internalComponentNames.has(tagName)) {
          usedComponents.add(toDashed(tagName));
        }
        break;
      }
      case 'FunctionDeclaration':
      case 'VariableDeclarator': {
        if (!hasLocalBinding) {
          hasLocalBinding = getIdentifierName(node.id) === importNativeComponentName;
        }
        break;
      }
      case 'ImportDeclaration': {
        if (!hasLocalBinding) {
          const specifiers = Array.isArray(node.specifiers) ? node.specifiers : [];
          hasLocalBinding = specifiers.some(
            (specifier) => getIdentifierName((specifier as AstNode).local) === importNativeComponentName,
          );
        }
        break;
      }
      case 'CallExpression': {
        const calleeName = getIdentifierName(node.callee);
        if (defineConfigNames.has(calleeName || '') || calleeName === importNativeComponentName) {
          pendingCallExpressions.push(node);
        }
        break;
      }
    }
  });

  if (hasLocalBinding) {
    return {
      code,
      enableImportComponent: false,
      usedComponents,
    };
  }

  const sourceEdits: SourceEdit[] = [];

  for (const node of pendingCallExpressions) {
    const calleeName = getIdentifierName(node.callee);

    if (defineConfigNames.has(calleeName || '') && configFileReg.test(id)) {
      sourceEdits.push({
        start: node.start,
        end: node.end,
        value: '',
      });
      continue;
    }

    if (calleeName !== importNativeComponentName) continue;

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
  }

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

        const instantiatePage = `var inst = Page(createPageConfig(component, '${page.name}', {root:{cn:[]}}, config || {}))`;

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

      // 快速跳过：三种能力分支都不可能命中的模块不做 parseAst——
      // 组件收集只发生在含 JSX 的 .jsx/.tsx（getParseLang 中 .ts/.mts/.js/.mjs 均按无 JSX 解析）；
      // defineAppConfig/definePageConfig 宏擦除只针对 configFileReg 命中的文件；
      // importNativeComponent 改写（含本地绑定检测）要求代码中出现该标识符。
      if (!jsxFileReg.test(id) && !configFileReg.test(id) && !code.includes(importNativeComponentName)) {
        // 与走全量流程时 nCompCache.set(id, {}) 等价（读取侧 nCompCache.get(dep) || {}），
        // 同时清掉 watch 模式下该文件可能残留的旧原生组件条目
        nCompCache.delete(id);
        return;
      }

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
