import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ILoaderMeta } from '@spcsn/taro/types/compile/config/plugin';
import type { Frameworks } from './index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  };
}
