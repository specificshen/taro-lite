/**
 * 给 TaroElement 绑定 react fiber、react props 等属性
 * 提供 fiber -> element、element -> fiber、element -> props 的方法
 */
import { internalContainerInstanceKey, internalInstanceKey, internalPropsKey } from './constant';
import { HostComponent, HostRoot, HostText, SuspenseComponent } from './work-tags';

import type { TaroElement, TaroText } from '@spcsn/taro-runtime';
import type { Fiber } from 'react-reconciler';
import type { Props } from './props';

export function precacheFiberNode(hostInst: Fiber, node: TaroElement | TaroText): void {
  (node as Record<string, any>)[internalInstanceKey] = hostInst;
}

export function markContainerAsRoot(hostRoot: Fiber, node: TaroElement | TaroText): void {
  (node as Record<string, any>)[internalContainerInstanceKey] = hostRoot;
}

export function unmarkContainerAsRoot(node: TaroElement | TaroText): void {
  (node as Record<string, any>)[internalContainerInstanceKey] = null;
}

export function isContainerMarkedAsRoot(node: TaroElement | TaroText): boolean {
  return !!(node as Record<string, any>)[internalContainerInstanceKey];
}

/**
 * Given a DOM node, return the ReactDOMComponent or ReactDOMTextComponent
 * instance, or null if the node was not rendered by this React.
 */
export function getInstanceFromNode(node: TaroElement | TaroText): Fiber | null {
  const inst =
    (node as Record<string, any>)[internalInstanceKey] || (node as Record<string, any>)[internalContainerInstanceKey];

  if (inst) {
    if (
      inst.tag === HostComponent ||
      inst.tag === HostText ||
      inst.tag === SuspenseComponent ||
      inst.tag === HostRoot
    ) {
      return inst;
    } else {
      return null;
    }
  }
  return null;
}

/**
 * Given a ReactDOMComponent or ReactDOMTextComponent, return the corresponding
 * DOM node.
 */
export function getNodeFromInstance(inst: Fiber) {
  if (inst.tag === HostComponent || inst.tag === HostText) {
    // In Fiber this, is just the state node right now. We assume it will be
    // a host component or host text.
    return inst.stateNode;
  }
}

export function getFiberCurrentPropsFromNode(node: TaroElement | TaroText): Props {
  return (node as Record<string, any>)[internalPropsKey] || null;
}

export function updateFiberProps(node: TaroElement | TaroText, props: Props): void {
  (node as Record<string, any>)[internalPropsKey] = props;
}
