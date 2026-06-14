import path from 'node:path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import type { Node } from 'acorn';
import type { Frameworks } from './index';
import type { ILoaderMeta } from '@spcsn/taro/types/compile/config/plugin';

function addConfig(source: string) {
  const configsMap: Record<string, string[]> = {
    enableShareAppMessage: ['onShareAppMessage', 'useShareAppMessage'],
    enableShareTimeline: ['onShareTimeline', 'useShareTimeline'],
  };
  const ast = acorn.parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });

  const additionConfig: Record<string, boolean> = {};

  function check(name: string) {
    Object.keys(configsMap).forEach((configName) => {
      const apis: string[] = configsMap[configName];
      if (apis.includes(name)) {
        additionConfig[configName] = true;
      }
    });
  }

  walk.simple(ast, {
    FunctionExpression(node: Node) {
      const n = node as unknown as acorn.FunctionExpression;
      if (n.id?.name) check(n.id.name);
    },
    FunctionDeclaration(node: Node) {
      const n = node as unknown as acorn.FunctionDeclaration;
      if (n.id?.name) check(n.id.name);
    },
    CallExpression(node: Node) {
      const n = node as unknown as acorn.CallExpression;
      const { callee } = n;
      if (callee.type === 'Identifier') {
        check(callee.name);
      } else if (callee.type === 'MemberExpression') {
        if (callee.property.type === 'Identifier') {
          check(callee.property.name);
        } else if (callee.property.type === 'Literal' && typeof callee.property.value === 'string') {
          check(callee.property.value);
        }
      }
      n.arguments.forEach((item) => {
        if (item.type === 'Literal' && item.value && typeof item.value === 'string') {
          check(item.value);
        }
      });
    },
    ClassDeclaration(node: Node) {
      checkClassNode(node as unknown as acorn.ClassDeclaration);
    },
    ClassExpression(node: Node) {
      checkClassNode(node as unknown as acorn.ClassExpression);
    },
  });

  function checkClassNode(node: acorn.ClassDeclaration | acorn.ClassExpression) {
    if (node.id && node.id.name) {
      check(node.id.name);
    }
    node.body.body.forEach((method) => {
      if (method.type === 'MethodDefinition') {
        if (method.key.type === 'Identifier') {
          check(method.key.name);
        } else if (method.key.type === 'Literal' && typeof method.key.value === 'string') {
          check(method.key.value);
        }
      }
    });
  }

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
    modifyConfig(config, source) {
      Object.assign(config, addConfig(source));
    },
  };
}
