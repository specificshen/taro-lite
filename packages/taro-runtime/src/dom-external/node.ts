import { DATASET, PROPS, STYLE } from '../constants';
import { NodeType } from '../dom/node-types';
import type { TaroNode } from '../dom/node';

export function cloneNode(this: TaroNode, isDeep = false) {
  const document = this.ownerDocument;
  let newNode;

  if (this.nodeType === NodeType.ELEMENT_NODE) {
    newNode = document.createElement(this.nodeName);
  } else if (this.nodeType === NodeType.TEXT_NODE) {
    newNode = document.createTextNode('');
  }

  for (const key in this) {
    const value: any = this[key];
    if ([PROPS, DATASET].includes(key) && typeof value === 'object') {
      newNode[key] = { ...value };
    } else if (key === '_value') {
      newNode[key] = value;
    } else if (key === STYLE) {
      newNode.style._value = { ...value._value };
      newNode.style._usedStyleProp = new Set(Array.from(value._usedStyleProp));
    }
  }

  if (isDeep) {
    newNode.childNodes = this.childNodes.map((node) => (node as any).cloneNode(true));
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
