/**
 * 给 TaroElement 绑定 react fiber、react props 等属性
 * 提供 fiber -> element、element -> props 的方法
 */

import type { TaroElement, TaroText } from '@spcsn/taro/runtime';
import type { Fiber } from 'react-reconciler';
import { internalContainerInstanceKey, internalInstanceKey, internalPropsKey } from './constant';
import type { Props } from './props';

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

export function updateFiberProps(node: TaroElement | TaroText, props: Props): void {
  getNodeData(node)[internalPropsKey] = props;
}
