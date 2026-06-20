import type { EventCallbacks } from './event-emitter';
import { Events } from './event-emitter';
import { isFunction } from './shared-primitives';
import type { Shortcuts } from './shortcuts';

type TFunc = (...args: unknown[]) => unknown;

export enum HOOK_TYPE {
  SINGLE,
  MULTI,
  WATERFALL,
}

interface Hook {
  type: HOOK_TYPE;
  initial?: TFunc | null;
}

interface Node {
  next: Node;
  context?: unknown;
  callback?: TFunc;
}

interface MiniLifecycle {
  app: [string, string, string];
  page: [string, string, string, string, string, string[], string[]];
  component: [string, string];
}

interface MiniElementData {
  [Shortcuts.Childnodes]?: MiniData[];
  [Shortcuts.NodeName]: string;
  [Shortcuts.Class]?: string;
  [Shortcuts.Style]?: string;
  uid?: string;
  sid: string;
  [key: string]: unknown;
}

interface MiniTextData {
  [Shortcuts.Text]: string;
  [Shortcuts.NodeName]: string;
}

type MiniData = MiniElementData | MiniTextData;

type Target = Record<string, unknown> & { dataset: Record<string, unknown>; id: string };

interface MpEvent {
  type: string;
  detail: Record<string, unknown>;
  target: Target;
  currentTarget: Target;
}

const defaultMiniLifecycle: MiniLifecycle = {
  app: ['onLaunch', 'onShow', 'onHide'],
  page: [
    'onLoad',
    'onUnload',
    'onReady',
    'onShow',
    'onHide',
    [
      'onPullDownRefresh',
      'onReachBottom',
      'onPageScroll',
      'onResize',
      'defer:onTabItemTap',
      'onTitleClick',
      'onOptionMenuClick',
      'events:onKeyboardHeight',
      'onPopMenuClick',
      'onPullIntercept',
      'onAddToFavorites',
    ],
    ['onShareAppMessage', 'onShareTimeline'],
  ],
  component: ['attached', 'detached'],
};

export function TaroHook(type: HOOK_TYPE, initial?: TFunc): Hook {
  return {
    type,
    initial: initial || null,
  };
}

export class TaroHooks<T extends Record<string, TFunc> = Record<string, TFunc>> extends Events {
  hooks: Record<keyof T, Hook>;

  constructor(hooks: Record<keyof T, Hook>, opts?: { callbacks?: EventCallbacks }) {
    super(opts);
    this.hooks = hooks;
    for (const hookName in hooks) {
      const { initial } = hooks[hookName];
      if (isFunction(initial)) {
        this.on(hookName, initial);
      }
    }
  }

  private tapOneOrMany<K extends Extract<keyof T, string>>(hookName: K, callback: T[K] | T[K][]) {
    const list = isFunction(callback) ? [callback] : callback;
    list.forEach((cb) => this.on(hookName, cb));
  }

  tap<K extends Extract<keyof T, string>>(hookName: K, callback: T[K] | T[K][]) {
    const hooks = this.hooks;
    const { type, initial } = hooks[hookName];
    if (type === HOOK_TYPE.SINGLE) {
      this.off(hookName);
      this.on(hookName, isFunction(callback) ? callback : callback[callback.length - 1]);
    } else {
      initial && this.off(hookName, initial);
      this.tapOneOrMany(hookName, callback);
    }
  }

  call<K extends Extract<keyof T, string>>(hookName: K, ...rest: Parameters<T[K]>): ReturnType<T[K]> | undefined {
    const hook = this.hooks[hookName];
    if (!hook) return;

    const { type } = hook;

    const calls = this.callbacks;
    if (!calls) return;

    const list = calls[hookName] as { tail: Node; next: Node };

    if (list) {
      const tail = list.tail;
      let node: Node = list.next;
      let args: unknown[] = rest;
      let res: unknown;

      while (node !== tail) {
        res = node.callback?.apply(node.context || this, args);
        if (type === HOOK_TYPE.WATERFALL) {
          const params: unknown[] = [res];
          args = params;
        }
        node = node.next;
      }
      return res as ReturnType<T[K]> | undefined;
    }
  }

  isExist(hookName: string) {
    return Boolean(this.callbacks?.[hookName]);
  }
}

type ITaroHooks = {
  getMiniLifecycle: (defaultConfig: unknown) => MiniLifecycle;
  getMiniLifecycleImpl: () => MiniLifecycle;
  getLifecycle: (instance: unknown, lifecyle: unknown) => TFunc | Array<TFunc> | undefined;
  modifyRecursiveComponentConfig: (defaultConfig: unknown, options: unknown) => unknown;
  getPathIndex: (indexOfNode: unknown) => string;
  getEventCenter: (EventsClass: unknown) => Events;
  isBubbleEvents: (eventName: unknown) => boolean;
  getSpecialNodes: () => string[];
  onRemoveAttribute: (element: unknown, qualifiedName: unknown) => boolean;
  batchedEventUpdates: (cb: unknown) => void;
  mergePageInstance: (prev: unknown, next: unknown) => void;
  modifyPageObject: (config: unknown) => void;
  createPullDownComponent: (
    el: unknown,
    path: unknown,
    framework: unknown,
    customWrapper?: unknown,
    stampId?: unknown,
  ) => void;
  getDOMNode: (instance: unknown) => unknown;
  modifyHydrateData: (data: unknown, node: unknown) => void;
  transferHydrateData: (data: unknown, element: unknown, componentsAlias: unknown) => void;
  modifySetAttrPayload: (element: unknown, key: unknown, payload: unknown, componentsAlias: unknown) => void;
  modifyRmAttrPayload: (element: unknown, key: unknown, payload: unknown, componentsAlias: unknown) => void;
  onAddEvent: (type: unknown, handler: unknown, options: unknown, node: unknown) => void;
  modifyMpEvent: (event: unknown) => void;
  modifyMpEventImpl: (event: unknown) => void;
  modifyTaroEvent: (event: unknown, element: unknown) => void;

  dispatchTaroEvent: (event: unknown, element: unknown) => void;
  dispatchTaroEventFinish: (event: unknown, element: unknown) => void;
  modifyTaroEventReturn: (node: unknown, event: unknown, returnVal: unknown) => unknown;

  modifyDispatchEvent: (event: unknown, element: unknown) => void;
  injectNewStyleProperties: (styleProperties: unknown) => void;
  initNativeApi: (taro: unknown) => void;
  patchElement: (node: unknown) => void;

  proxyToRaw: (proxyObj: unknown) => Record<string, unknown>;
  modifyAddEventListener: (element: unknown, sideEffect: unknown, getComponentsAlias: unknown) => void;
  modifyRemoveEventListener: (element: unknown, sideEffect: unknown, getComponentsAlias: unknown) => void;
  getMemoryLevel: (level: unknown) => void;
};

export const hooks = new TaroHooks<ITaroHooks>({
  getMiniLifecycle: TaroHook(HOOK_TYPE.SINGLE, (defaultConfig) => defaultConfig as MiniLifecycle),

  getMiniLifecycleImpl: TaroHook(HOOK_TYPE.SINGLE, function (this: TaroHooks<ITaroHooks>) {
    return this.call('getMiniLifecycle', defaultMiniLifecycle);
  }),

  getLifecycle: TaroHook(
    HOOK_TYPE.SINGLE,
    (instance, lifecycle) => (instance as Record<string, TFunc>)[lifecycle as string],
  ),

  modifyRecursiveComponentConfig: TaroHook(HOOK_TYPE.SINGLE, (defaultConfig) => defaultConfig),

  getPathIndex: TaroHook(HOOK_TYPE.SINGLE, (indexOfNode) => `[${indexOfNode as number}]`),

  getEventCenter: TaroHook(HOOK_TYPE.SINGLE, (Events) => new (Events as new () => Events)()),

  isBubbleEvents: TaroHook(HOOK_TYPE.SINGLE, (eventName) => {
    const BUBBLE_EVENTS = new Set([
      'touchstart',
      'touchmove',
      'touchcancel',
      'touchend',
      'touchforcechange',
      'tap',
      'longpress',
      'longtap',
      'transitionend',
      'animationstart',
      'animationiteration',
      'animationend',
    ]);

    return BUBBLE_EVENTS.has(eventName as string);
  }),

  getSpecialNodes: TaroHook(HOOK_TYPE.SINGLE, () => ['view', 'text', 'image']),

  onRemoveAttribute: TaroHook(HOOK_TYPE.SINGLE),

  batchedEventUpdates: TaroHook(HOOK_TYPE.SINGLE),

  mergePageInstance: TaroHook(HOOK_TYPE.SINGLE),

  modifyPageObject: TaroHook(HOOK_TYPE.SINGLE),

  createPullDownComponent: TaroHook(HOOK_TYPE.SINGLE),

  getDOMNode: TaroHook(HOOK_TYPE.SINGLE),

  modifyHydrateData: TaroHook(HOOK_TYPE.SINGLE),

  transferHydrateData: TaroHook(HOOK_TYPE.SINGLE),

  modifySetAttrPayload: TaroHook(HOOK_TYPE.SINGLE),

  modifyRmAttrPayload: TaroHook(HOOK_TYPE.SINGLE),

  onAddEvent: TaroHook(HOOK_TYPE.SINGLE),

  proxyToRaw: TaroHook(HOOK_TYPE.SINGLE, function (proxyObj) {
    return proxyObj as Record<string, unknown>;
  }),

  modifyMpEvent: TaroHook(HOOK_TYPE.MULTI),

  modifyMpEventImpl: TaroHook(HOOK_TYPE.SINGLE, function (this: TaroHooks<ITaroHooks>, e: unknown) {
    try {
      this.call('modifyMpEvent', e as MpEvent);
    } catch (error) {
      console.warn('[Taro modifyMpEvent hook Error]: ' + (error instanceof Error ? error.message : String(error)));
    }
  }),

  injectNewStyleProperties: TaroHook(HOOK_TYPE.SINGLE),

  modifyTaroEvent: TaroHook(HOOK_TYPE.MULTI),

  dispatchTaroEvent: TaroHook(HOOK_TYPE.SINGLE, (e, node) => {
    (node as { dispatchEvent: (event: unknown) => void }).dispatchEvent(e);
  }),

  dispatchTaroEventFinish: TaroHook(HOOK_TYPE.MULTI),

  modifyTaroEventReturn: TaroHook(HOOK_TYPE.SINGLE, () => undefined),

  modifyDispatchEvent: TaroHook(HOOK_TYPE.MULTI),

  initNativeApi: TaroHook(HOOK_TYPE.MULTI),

  patchElement: TaroHook(HOOK_TYPE.MULTI),

  modifyAddEventListener: TaroHook(HOOK_TYPE.SINGLE),

  modifyRemoveEventListener: TaroHook(HOOK_TYPE.SINGLE),

  getMemoryLevel: TaroHook(HOOK_TYPE.SINGLE),
});
