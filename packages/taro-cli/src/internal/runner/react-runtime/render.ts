import type { TaroElement, TaroEvent } from '@spcsn/taro/runtime';
import { hooks } from '@spcsn/taro/runtime';
import type { ReactNode } from 'react';
import type { OpaqueRoot } from 'react-reconciler';
import { markContainerAsRoot } from './component-tree';
import { getEventPriority } from './constant';
import { markShouldFlushAfterEvent } from './event';
import { runWithPriority, TaroReconciler } from './reconciler';
import { isTextInputElement } from './text-input';

export const ContainerMap: WeakMap<TaroElement, Root> = new WeakMap();

type Renderer = typeof TaroReconciler;

type CreateRootOptions = {
  unstable_strictMode?: boolean;
  identifierPrefix?: string;
  onRecoverableError?: (error: unknown) => void;
};

export type Callback = () => undefined | null | undefined;

class Root {
  private renderer: Renderer;
  public internalRoot: OpaqueRoot;

  public constructor(renderer: Renderer, domContainer: TaroElement, options?: CreateRootOptions) {
    this.renderer = renderer;
    this.initInternalRoot(renderer, domContainer, options);
  }

  private initInternalRoot(renderer: Renderer, domContainer: TaroElement, options?: CreateRootOptions) {
    // Since react-reconciler v0.27, createContainer need more parameters
    // @see:https://github.com/facebook/react/blob/0b974418c9a56f6c560298560265dcf4b65784bc/packages/react-reconciler/src/ReactFiberReconciler.js#L248
    const containerInfo = domContainer;
    if (options) {
      const tag = 1; // ConcurrentRoot
      const concurrentUpdatesByDefaultOverride = false;
      let isStrictMode = false;
      let identifierPrefix = '';
      let onRecoverableError = (error: unknown) => console.error(error);
      if (options.unstable_strictMode === true) {
        isStrictMode = true;
      }
      if (options.identifierPrefix !== undefined) {
        identifierPrefix = options.identifierPrefix;
      }
      if (options.onRecoverableError !== undefined) {
        onRecoverableError = options.onRecoverableError;
      }
      this.internalRoot = renderer.createContainer(
        containerInfo,
        tag,
        null, // hydrationCallbacks
        isStrictMode,
        concurrentUpdatesByDefaultOverride,
        identifierPrefix,
        onRecoverableError,
        onRecoverableError,
        onRecoverableError,
        () => {},
      );
    } else {
      const tag = 0; // LegacyRoot
      this.internalRoot = renderer.createContainer(
        containerInfo,
        tag,
        null, // hydrationCallbacks
        false, // isStrictMode
        false, // concurrentUpdatesByDefaultOverride,
        '', // identifierPrefix
        () => {}, // onRecoverableError, this isn't reachable because onRecoverableError isn't called in the legacy API.
        () => {},
        () => {},
        () => {},
      );
    }
  }

  public render(children: ReactNode, cb: Callback) {
    const { renderer, internalRoot } = this;
    renderer.updateContainer(children, internalRoot, null, cb);
    return renderer.getPublicRootInstance(internalRoot);
  }

  public unmount(cb: Callback) {
    this.renderer.updateContainer(null, this.internalRoot, null, cb);
  }
}

export function render(element: ReactNode, domContainer: TaroElement, cb: Callback) {
  const oldRoot = ContainerMap.get(domContainer);
  if (oldRoot != null) {
    return oldRoot.render(element, cb);
  }

  const root = new Root(TaroReconciler, domContainer);
  ContainerMap.set(domContainer, root);
  return root.render(element, cb);
}

export function createRoot(domContainer: TaroElement, options: CreateRootOptions = {}) {
  const oldRoot = ContainerMap.get(domContainer);
  if (oldRoot != null) {
    return oldRoot;
  }
  const root = new Root(TaroReconciler, domContainer, options);
  ContainerMap.set(domContainer, root);

  markContainerAsRoot(root?.internalRoot?.current, domContainer);

  hooks.tap('dispatchTaroEvent', (event: unknown, element: unknown) => {
    const e = event as TaroEvent;
    const node = element as TaroElement;
    const eventPriority = getEventPriority(e.type);

    runWithPriority(eventPriority, () => {
      node.dispatchEvent(e);
    });
  });

  // input/change 事件结束后需要立即把 state 落位，避免受控 input 出现闪烁。
  hooks.tap('modifyTaroEvent', (event: unknown, element: unknown) => {
    const e = event as TaroEvent;
    const node = element as TaroElement;

    if (isTextInputElement(node) && (e.type === 'input' || e.type === 'change')) {
      markShouldFlushAfterEvent();
    }
  });

  return root;
}
