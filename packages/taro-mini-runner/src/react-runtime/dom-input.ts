import { supportedInputTypes } from './constant';
import { Props } from './props';
import type { FormElement, TaroElement } from '@spcsn/taro-runtime';
import type { RestoreType } from './event';

// 从 props 中，更新 input 组件的 value 值
function updateInputWrapper(element: TaroElement, oldValue: RestoreType, props: Props) {
  const node = element;
  const checked = props.checked;

  if (checked != null) {
    console.warn('updateCheck is not supported for mini controlled inputs', node);
    return;
  }

  updateWrapper(element, oldValue, props);
  updateNamedCousins(element, props);
}

// react 中原本处理 type=radio 的逻辑；mini 运行时保留 no-op 兼容分支。
function updateNamedCousins(rootNode, props) {
  const name = props.name;

  if (props.type === 'radio' && name != null) {
    console.warn('radio updateNamedCousins is not supported for mini controlled inputs', rootNode, props);
  }
}

export function getToStringValue(value: any) {
  const isEmptyType = typeof value === 'function' || typeof value === 'symbol';

  return isEmptyType ? '' : value;
}

export function toString(value): string {
  return '' + value;
}

export function updateWrapper(element: TaroElement, oldValue: RestoreType, props: Props) {
  const node = element as FormElement;
  const value = getToStringValue(props.value);
  const type = props.type as string;

  setNodeValue(node, oldValue, value, type);
}

// oldValue 为 event.detail.value，value 为 fiber.props.value
// 如果 oldValue 和 value 不相等，代表受控组件需要更新
// 更新的原则为，fiber.props.value 永远为用户所需要的值，因此 node.value = toString(value)
function hasDifferentNumericValue(oldValue: RestoreType, value: unknown): boolean {
  if (oldValue === value) {
    return false;
  }

  const previousNumericValue = Number(oldValue);
  const nextNumericValue = Number(value);
  if (!Number.isNaN(previousNumericValue) && !Number.isNaN(nextNumericValue)) {
    return previousNumericValue !== nextNumericValue;
  }

  return String(oldValue) !== String(value);
}

export function setNodeValue(node: FormElement, oldValue: RestoreType, value, type = 'string') {
  if (value != null) {
    if (type === 'number') {
      if ((value === 0 && node.value === '') || hasDifferentNumericValue(oldValue, value)) {
        node.value = toString(value);
      }
    } else if (oldValue !== toString(value)) {
      node.value = toString(value);
    }
  } else if (type === 'submit' || type === 'reset') {
    // Submit/reset inputs need the attribute removed completely to avoid
    // blank-text buttons.
    node.removeAttribute('value');
  }
}

// 判断当前 TaroElement 是否为 supportedInputTypes input 或 textarea
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

export const ReactDOMTextareaRestoreControlledState = updateWrapper;
export const ReactDOMInputRestoreControlledState = updateInputWrapper;
