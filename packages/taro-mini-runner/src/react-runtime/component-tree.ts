/**
 * 给 TaroElement 绑定 react fiber、react props 等属性
 * 提供 fiber -> element、element -> fiber、element -> props 的方法
 */

import type { TaroElement, TaroText } from '@spcsn/taro-runtime';
import type { Fiber } from 'react-reconciler';
import { internalContainerInstanceKey, internalInstanceKey, internalPropsKey } from './constant';
import type { Props } from './props';
import { HostComponent, HostRoot, HostText, SuspenseComponent } from './work-tags';

type NodeData = Record<string, unknown>;

function getNodeData(node: TaroElement | TaroText): NodeData {
  return node as unknown as NodeData;
}

export function precacheFiberNode(hostInst: Fiber, node: TaroElement | TaroText): void {
  getNodeData(node)[internalInstanceKey] = hostInst;
}

export function markContainerAsRoot(hostRoot: Fiber, node: TaroElement | TaroText): void {
  getNodeData(node)[internalContainerInstanceKey] = hostRoot;
}

export function unmarkContainerAsRoot(node: TaroElement | TaroText): void {
  getNodeData(node)[internalContainerInstanceKey] = null;
}

export function isContainerMarkedAsRoot(node: TaroElement | TaroText): boolean {
  return !!getNodeData(node)[internalContainerInstanceKey];
}

export function getInstanceFromNode(node: TaroElement | TaroText): Fiber | null {
  const data = getNodeData(node);
  const inst =
    (data[internalInstanceKey] as Fiber | undefined) || (data[internalContainerInstanceKey] as Fiber | undefined);

  if (inst) {
    if (
      inst.tag === HostComponent ||
      inst.tag === HostText ||
      inst.tag === SuspenseComponent ||
      inst.tag === HostRoot
    ) {
      return inst;
    }
  }
  return null;
}

export function getNodeFromInstance(inst: Fiber) {
  if (inst.tag === HostComponent || inst.tag === HostText) {
    return inst.stateNode;
  }
}

export function getFiberCurrentPropsFromNode(node: TaroElement | TaroText): Props {
  return (getNodeData(node)[internalPropsKey] as Props) || null;
}

export function updateFiberProps(node: TaroElement | TaroText, props: Props): void {
  getNodeData(node)[internalPropsKey] = props;
}
