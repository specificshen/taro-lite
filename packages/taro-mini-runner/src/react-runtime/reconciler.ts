import { document, FormElement } from '@spcsn/taro-runtime';
import { isBoolean, isUndefined, noop } from '@spcsn/taro-shared';
import { createContext } from 'react';
import Reconciler from 'react-reconciler';
import { DefaultEventPriority, NoEventPriority } from 'react-reconciler/constants';
import { precacheFiberNode, updateFiberProps } from './component-tree';
import { track } from './input-value-tracking';
import { getUpdatePayload, Props, updateProps, updatePropsByPayload } from './props';
import type { TaroElement, TaroText } from '@spcsn/taro-runtime';
import type { Fiber, HostConfig } from 'react-reconciler';

let currentUpdatePriority = NoEventPriority;

const hostConfig: HostConfig<
  string, // Type
  Props, // Props
  TaroElement, // Container
  TaroElement, // Instance
  TaroText, // TextInstance
  TaroElement, // SuspenseInstance
  TaroElement, // HydratableInstance
  TaroElement, // FormInstance
  TaroElement, // PublicInstance
  Record<string, any>, // HostContext
  unknown, // ChildSet
  unknown, // TimeoutHandle
  unknown, // NoTimeout
  unknown // TransitionStatus
> & {
  supportsMicrotasks: boolean; // 待官方类型文件修复后删除
} = {
  // below keys order by {React ReactFiberHostConfig.custom.js}, convenient for comparing each other.

  // -------------------
  // required by @types/react-reconciler
  // -------------------
  getPublicInstance(inst: TaroElement) {
    return inst;
  },
  getRootHostContext() {
    return {};
  },
  getChildHostContext(parentHostContext) {
    return parentHostContext;
  },
  prepareForCommit(..._: any[]) {
    return null;
  },
  resetAfterCommit: noop,
  createInstance(type, props: Props, _rootContainerInstance: any, _hostContext: any, internalInstanceHandle: Fiber) {
    const element = document.createElement(type);

    precacheFiberNode(internalInstanceHandle, element);
    updateFiberProps(element, props);

    return element;
  },
  appendInitialChild(parent, child) {
    parent.appendChild(child);
  },
  finalizeInitialChildren(dom, type: string, props: any) {
    let newProps = props;
    if (dom instanceof FormElement) {
      const [defaultName, defaultKey] = ['switch', 'checkbox', 'radio'].includes(type)
        ? ['checked', 'defaultChecked']
        : ['value', 'defaultValue'];
      if (props.hasOwnProperty(defaultKey)) {
        newProps = { ...newProps, [defaultName]: props[defaultKey] };
        delete newProps[defaultKey];
      }
    }

    updateProps(dom, {}, newProps); // 提前执行更新属性操作，Taro 在 Page 初始化后会立即从 dom 读取必要信息

    if (type === 'input' || type === 'textarea') {
      track(dom);
    }

    return false;
  },
  shouldSetTextContent() {
    return false;
  },
  createTextInstance(text: string, _rootContainerInstance: any, _hostContext: any, internalInstanceHandle: Fiber) {
    const textNode = document.createTextNode(text);

    precacheFiberNode(internalInstanceHandle, textNode);

    return textNode;
  },
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  isPrimaryRenderer: true,
  warnsIfNotActing: true,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: noop,
  afterActiveInstanceBlur: noop,
  preparePortalMount: noop,
  prepareScopeUpdate: noop,
  getInstanceFromScope: () => null,
  NotPendingTransition: null,
  HostTransitionContext: createContext(null) as any,
  setCurrentUpdatePriority(newPriority) {
    currentUpdatePriority = newPriority;
  },
  getCurrentUpdatePriority() {
    return currentUpdatePriority;
  },
  resolveUpdatePriority() {
    return DefaultEventPriority;
  },
  resetFormInstance: noop,
  requestPostPaintCallback(callback) {
    setTimeout(() => callback(Date.now()), 0);
  },
  shouldAttemptEagerTransition() {
    return false;
  },
  trackSchedulerEvent: noop,
  resolveEventType() {
    return null;
  },
  resolveEventTimeStamp() {
    return Date.now();
  },
  maySuspendCommit() {
    return false;
  },
  preloadInstance() {
    return true;
  },
  startSuspendingCommit: noop,
  suspendInstance: noop,
  waitForCommitToBeReady() {
    return null;
  },
  detachDeletedInstance: noop,

  // -------------------
  //      Microtasks
  //     (optional)
  // -------------------
  supportsMicrotasks: true,
  scheduleMicrotask: isUndefined(Promise)
    ? setTimeout
    : (callback) =>
        Promise.resolve(null)
          .then(callback)
          .catch(function (error) {
            setTimeout(() => {
              throw error;
            });
          }),

  // -------------------
  //      Mutation
  //     (required if supportsMutation is true)
  // -------------------
  appendChild(parent, child) {
    parent.appendChild(child);
  },
  appendChildToContainer(parent, child) {
    parent.appendChild(child);
  },
  commitTextUpdate(textInst, _, newText) {
    textInst.nodeValue = newText;
  },
  commitMount: noop,
  commitUpdate(dom, _type, oldProps, newProps) {
    const updatePayload = getUpdatePayload(dom, oldProps, newProps);
    if (!updatePayload) return;
    // payload 只包含 children 的时候，不应该再继续触发后续的属性比较和更新的逻辑了
    if (updatePayload.length === 2 && updatePayload.includes('children')) return;

    updatePropsByPayload(dom, oldProps, updatePayload);
    updateFiberProps(dom, newProps);
  },
  insertBefore(parent, child, refChild) {
    parent.insertBefore(child, refChild);
  },
  insertInContainerBefore(parent, child, refChild) {
    parent.insertBefore(child, refChild);
  },
  removeChild(parent, child) {
    parent.removeChild(child);
  },
  removeChildFromContainer(parent, child) {
    parent.removeChild(child);
  },
  resetTextContent: noop,
  hideInstance(instance) {
    const style = instance.style;
    style.setProperty('display', 'none');
  },
  hideTextInstance(textInstance) {
    textInstance.nodeValue = '';
  },
  unhideInstance(instance, props) {
    const styleProp = props.style as { display?: any };
    let display = styleProp?.hasOwnProperty('display') ? styleProp.display : null;
    display = display == null || isBoolean(display) || display === '' ? '' : ('' + display).trim();
    instance.style.setProperty('display', display);
  },
  unhideTextInstance(textInstance, text) {
    textInstance.nodeValue = text;
  },
  clearContainer(element) {
    if (element.childNodes.length > 0) {
      element.textContent = '';
    }
  },
};

const TaroReconciler = Reconciler(hostConfig);

export function flushSync(fn?: () => void) {
  const reconcilerFlushSync = (TaroReconciler as any).flushSync;
  if (typeof reconcilerFlushSync === 'function') {
    return reconcilerFlushSync.call(TaroReconciler, fn);
  }
  // react-reconciler >= 0.33.0 不再把 flushSync 挂到 reconciler 实例上，
  // 但提供了内部的 flushSyncFromReconciler；用它做兜底。
  const flushSyncFromReconciler = (TaroReconciler as any).flushSyncFromReconciler;
  if (typeof flushSyncFromReconciler === 'function') {
    return flushSyncFromReconciler(fn);
  }
  return fn?.();
}

export function runWithPriority<T>(priority: any, fn: () => T): T {
  const previousPriority = currentUpdatePriority;
  currentUpdatePriority = priority;
  try {
    return fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}

if (process.env.NODE_ENV !== 'production') {
  const foundDevTools = TaroReconciler.injectIntoDevTools({
    bundleType: 1,
    version: '18.0.0',
    rendererPackageName: 'taro-react',
  });
  if (!foundDevTools) {
    globalThis.console.info(
      '%cDownload the React DevTools ' +
        'for a better development experience: ' +
        'https://reactjs.org/link/react-devtools',
      'font-weight:bold',
    );
  }
}

export { TaroReconciler };
