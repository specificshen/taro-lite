import createDebugLogger from 'debug';

export * as swc from '@swc/core';
export * as chokidar from 'chokidar';

export const createDebug = (id: string) => createDebugLogger(id);

export * from './constants';
export * from './dotenv';
export * as npm from './npm';
export { default as createSwcRegister } from './swc-register';
export * from './terminal';
export * from './utils';
