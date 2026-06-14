import { DATASET, PROPS, STYLE } from '../constants';
import { NodeType } from '../dom/node-types';
import type { TaroElement } from '../dom/element';
import type { TaroNode } from '../dom/node';
import type { Style } from '../dom/style';
import type { TaroText } from '../dom/text';

interface TaroNodeImpl extends TaroNode {
  cloneNode(deep?: boolean): TaroNode;
  contains(node: TaroNode & { id?: string }): boolean;
}

export function cloneNode(this: TaroNode, isDeep = false): TaroNode | undefined {
  const document = this.ownerDocument;
  let newNode: TaroElement | TaroText | undefined;

  if (this.nodeType === NodeType.ELEMENT_NODE) {
    newNode = document.createElement(this.nodeName);
  } else if (this.nodeType === NodeType.TEXT_NODE) {
    newNode = document.createTextNode('');
  }

  for (const key in this) {
    const value: unknown = (this as unknown as Record<string, unknown>)[key];
    if ([PROPS, DATASET].includes(key) && typeof value === 'object') {
      (newNode as unknown as Record<string, unknown>)[key] = { ...(value as Record<string, unknown>) };
    } else if (key === '_value') {
      (newNode as TaroText)._value = value as string;
    } else if (key === STYLE) {
      (newNode as TaroElement).style._value = { ...((value as Style)._value as Record<string, unknown>) };
      (newNode as TaroElement).style._usedStyleProp = new Set(Array.from((value as Style)._usedStyleProp));
    }
  }

  if (isDeep) {
    (newNode as TaroNode).childNodes = this.childNodes.map((node) =>
      (node as TaroNodeImpl).cloneNode(true),
    ) as TaroNode[];
  }

  return newNode;
}

export function contains(this: TaroNode, node: TaroNode & { id?: string }): boolean {
  let isContains = false;
  this.childNodes.some((childNode) => {
    const { uid } = childNode;
    if (uid === node.uid || uid === node.id || (childNode as TaroNodeImpl).contains(node)) {
      isContains = true;
      return true;
    }
  });
  return isContains;
}
