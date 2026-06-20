import type { FormElement, TaroElement } from '@spcsn/taro/runtime';
import { supportedInputTypes } from './constant';

// 判断当前 TaroElement 是否属于需要立即 flush 的文本输入元素
export function isTextInputElement(elem: TaroElement): boolean {
  const nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();

  if (nodeName === 'input') {
    const type = (elem as FormElement).type;

    return !type || !!supportedInputTypes[type];
  }

  if (nodeName === 'textarea') {
    return true;
  }

  return false;
}
