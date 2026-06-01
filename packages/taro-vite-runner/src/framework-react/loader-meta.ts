// @ts-nocheck
import path from 'node:path';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

import { Frameworks } from './index';

import type { ILoaderMeta } from '@spcsn/taro/types/compile/config/plugin';

function addConfig(source) {
  const configsMap = {
    enableShareAppMessage: ['onShareAppMessage', 'useShareAppMessage'],
    enableShareTimeline: ['onShareTimeline', 'useShareTimeline'],
  };
  const ast = acorn.parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });

  const additionConfig: Record<string, any> = {};

  function check(name: string) {
    Object.keys(configsMap).forEach((configName) => {
      const apis: string[] = configsMap[configName];
      if (apis.includes(name)) {
        additionConfig[configName] = true;
      }
    });
  }

  walk.simple(ast, {
    FunctionExpression(node: any) {
      if (!node.id || !node.id.name) return;
      check(node.id.name);
    },
    FunctionDeclaration(node: any) {
      if (!node.id || !node.id.name) return;
      check(node.id.name);
    },
    CallExpression(node: any) {
      const { callee } = node;
      if (callee.type === 'Identifier') {
        check(callee.name);
      } else if (callee.type === 'MemberExpression') {
        if (callee.property.type === 'Identifier') {
          check(callee.property.name);
        } else if (callee.property.type === 'Literal') {
          check(callee.property.value);
        }
      }
      node.arguments.forEach((item: any) => {
        if (item.type === 'Literal' && item.value) {
          check(item.value);
        }
      });
    },
    ClassDeclaration(node: any) {
      // 类声明: class Foo {}
      if (node.id && node.id.name) {
        check(node.id.name);
      }
      // 类体方法: class Foo { bar() {} }
      node.body.body.forEach((method: any) => {
        if (method.type === 'MethodDefinition') {
          if (method.key.type === 'Identifier') {
            check(method.key.name);
          } else if (method.key.type === 'Literal') {
            check(method.key.value as string);
          }
        }
      });
    },
    ClassExpression(node: any) {
      // 类表达式: const A = class B {}
      if (node.id && node.id.name) {
        check(node.id.name);
      }
      node.body.body.forEach((method: any) => {
        if (method.type === 'MethodDefinition') {
          if (method.key.type === 'Identifier') {
            check(method.key.name);
          } else if (method.key.type === 'Literal') {
            check(method.key.value as string);
          }
        }
      });
    },
  });

  return additionConfig;
}

export function getLoaderMeta(_framework: Frameworks): ILoaderMeta {
  return {
    importFrameworkStatement: `
import * as React from 'react'
import ReactDOM from 'react-dom'
`,
    mockAppStatement: `
class App extends React.Component {
  render () {
    return this.props.children
  }
}
`,
    frameworkArgs: 'React, ReactDOM, config',
    creator: 'createReactApp',
    creatorLocation: path.join(__dirname, 'runtime'),
    importFrameworkName: 'React',
    extraImportForWeb: '',
    execBeforeCreateWebApp: '',
    modifyConfig(config, source) {
      Object.assign(config, addConfig(source));
    },
  };
}
