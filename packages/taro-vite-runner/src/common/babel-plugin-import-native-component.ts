import path from 'node:path';

import { resolveMainFilePath } from '@spcsn/taro-helper';

import type * as BabelCore from '@babel/core';
import type {
  ViteHarmonyCompilerContext,
  ViteMiniCompilerContext,
} from '@spcsn/taro/types/compile/viteCompilerContext';

const IMPORT_COMPONENT_NAME = 'importNativeComponent';

type TCallback = (path: string | false, name?: string, exportName?: string) => string;
export default (compiler: ViteHarmonyCompilerContext | ViteMiniCompilerContext, id: string, cb: TCallback) => {
  return function pluginImportNativeComponent(babel: typeof BabelCore): BabelCore.PluginObj<BabelCore.PluginPass> {
    const t = babel.types as any;
    let enableImportComponent = true;

    return {
      name: 'plugin:import-native-component',
      visitor: {
        CallExpression(ast) {
          // 识别所有 importNativeComponent 函数调用, 并替换为对应的组件名
          if (t.isIdentifier(ast.node.callee, { name: IMPORT_COMPONENT_NAME })) {
            const pathArgNode = ast.node.arguments[0] as any;
            const nameArgNode = ast.node.arguments[1] as any;
            const exportNameArgNode = ast.node.arguments[2] as any;
            let pathArg = compiler.resolvePageImportPath(id, t.isStringLiteral(pathArgNode) ? pathArgNode.value : '');
            if (pathArg.startsWith('.')) {
              pathArg = path.resolve(path.dirname(id), pathArg);
            }
            pathArg = resolveMainFilePath(pathArg);
            const nameArg = t.isStringLiteral(nameArgNode) ? nameArgNode.value : '';
            const exportNameArg = t.isStringLiteral(exportNameArgNode) ? exportNameArgNode.value : 'default';

            if (enableImportComponent) {
              const nativeName = cb(pathArg, nameArg, exportNameArg);
              ast.replaceWith(t.stringLiteral(nativeName));
            }
          }
        },
        FunctionDeclaration(ast) {
          if (t.isIdentifier(ast.node.id, { name: IMPORT_COMPONENT_NAME })) {
            enableImportComponent = false;
            cb(false);
          }
        },
        ImportDeclaration(ast) {
          ast.node.specifiers.forEach((specifier) => {
            if (
              (t.isImportSpecifier(specifier) || t.isImportDefaultSpecifier(specifier)) &&
              specifier.local.name === IMPORT_COMPONENT_NAME
            ) {
              enableImportComponent = false;
              cb(false);
            }
          });
        },
        VariableDeclarator(ast) {
          if (
            t.isIdentifier(ast.node.id, { name: IMPORT_COMPONENT_NAME }) &&
            (t.isArrowFunctionExpression(ast.node.init) || t.isFunctionExpression(ast.node.init))
          ) {
            enableImportComponent = false;
            cb(false);
          }
        },
      },
    };
  };
};
