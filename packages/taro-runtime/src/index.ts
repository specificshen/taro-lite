// hook
// dom-external
import './dom-external';

import env from './env';

export { processApis } from '@spcsn/taro-shared';
export { mergeInternalComponents, mergeReconciler } from '@spcsn/taro-shared';
export { UnRecursiveTemplate } from '@spcsn/taro-shared/template';
export { hooks } from './runtime-hooks';
export { Shortcuts } from './shortcuts';
export { toCamelCase } from './shared-primitives';
// bom
export { taroDocumentProvider as document } from './bom/document';
export { taroGetComputedStyleProvider as getComputedStyle } from './bom/get-computed-style';
export { History } from './bom/history';
export { Location } from './bom/location';
export { nav as navigator } from './bom/navigator';
export { caf as cancelAnimationFrame, now, raf as requestAnimationFrame } from './bom/raf';
export { parseUrl, TaroURLProvider as URL } from './bom/url';
export { URLSearchParams } from './bom/url-search-params';
export {
  taroHistoryProvider as history,
  taroLocationProvider as location,
  taroWindowProvider as window,
} from './bom/window';
export * from './constants';
export type { Router } from './current';
export { Current, getCurrentInstance, setCurrentApp, whenAppReady } from './current';
// dom
export { TaroElement } from './dom/element';
export { createEvent, eventHandler, TaroEvent } from './dom/event';
export { eventSource } from './dom/event-source';
export { FormElement } from './dom/form';
export { TaroNode } from './dom/node';
export { TaroRootElement } from './dom/root';
export { Style } from './dom/style';
export { SVGElement } from './dom/svg';
export { TaroText } from './dom/text';
export { MutationObserver } from './dom-external/mutation-observer';
export {
  createComponentConfig,
  createPageConfig,
  createRecursiveComponentConfig,
  getOnHideEventKey,
  getOnReadyEventKey,
  getOnShowEventKey,
  getPageInstance,
  getPath,
  injectPageInstance,
  removePageInstance,
  safeExecute,
  stringify,
} from './dsl/common';
// typings
export * from './dsl/instance';
export * from './emitter/emitter';
export { hydrate } from './hydrate';
export * from './interface';
export { nextTick } from './next-tick';
export { options } from './options';
export * from './perf';
// Polyfills
export * from './polyfill';
export * from './utils';
// others
export { env };
