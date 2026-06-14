import { DATASET, PROPS, STYLE } from '../constants';
import { NodeType } from '../dom/node-types';
import type { TaroElement } from '../dom/element';
import type { TaroNode } from '../dom/node';
import type { TaroText } from '../dom/text';

export function cloneNode(this: TaroNode, isDeep = false): TaroNode | undefined {
  const document = this.ownerDocument;
  let newNode: TaroElement | TaroText | undefined;

  if (this.nodeType === NodeType.ELEMENT_NODE) {
    newNode = document.createElement(this.nodeName);
  } else if (this.nodeType === NodeType.TEXT_NODE) {
    newNode = document.createTextNode('');
  }

  for (const key in this) {
    const value: any = (this as any)[key];
    if ([PROPS, DATASET].includes(key) && typeof value === 'object') {
      (newNode as any)[key] = { ...value };
    } else if (key === '_value') {
      (newNode as any)[key] = value;
    } else if (key === STYLE) {
      (newNode as any).style._value = { ...value._value };
      (newNode as any).style._usedStyleProp = new Set(Array.from(value._usedStyleProp));
    }
  }

  if (isDeep) {
    (newNode as any).childNodes = this.childNodes.map((node) => (node as any).cloneNode(true));
  }

  return newNode;
}

export function contains(this: TaroNode, node: TaroNode & { id?: string }): boolean {
  let isContains = false;
  this.childNodes.some((childNode) => {
    const { uid } = childNode;
    if (uid === node.uid || uid === node.id || (childNode as any).contains(node)) {
      isContains = true;
      return true;
    }
  });
  return isContains;
}
