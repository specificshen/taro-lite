import { convertNumber2PX, eventHandlerTTDom, FormElement } from '@spcsn/taro-runtime';
import {
  capitalize,
  internalComponents,
  isEnableTTDom,
  isFunction,
  isNumber,
  isObject,
  isString,
  toCamelCase,
  UNITLESS_PROPERTIES_SET,
} from '@spcsn/taro-shared';

import type { Style, TaroElement } from '@spcsn/taro-runtime';

// 拓展TaroElement的属性

export type Props = Record<string, unknown>;

const IS_NON_DIMENSIONAL = /aspect|acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
const IS_DATASET_OR_ARIA = /^(data|aria)-/;

function isEventName(s: string) {
  return s[0] === 'o' && s[1] === 'n';
}

function isEqual(obj1, obj2) {
  // 首先检查引用是否相同
  if (obj1 === obj2) {
    return true;
  }

  // 如果两者中有一个不是对象，或者为 null，直接返回 false
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  // 获取两个对象键的数组
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // 如果键的数量不相同，对象显然不相等
  if (keys1.length !== keys2.length) {
    return false;
  }

  // 遍历对象的每个键，比较两个对象同一键的值
  for (let i = 0; i < keys1.length; i++) {
    const key = keys1[i];
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  // 如果所有键的值都相等，返回 true
  return true;
}

export function updateProps(dom: TaroElement, oldProps: Props, newProps: Props) {
  const updatePayload = getUpdatePayload(dom, oldProps, newProps);
  if (updatePayload) {
    updatePropsByPayload(dom, oldProps, updatePayload);
  }
}

export function updatePropsByPayload(dom: TaroElement, oldProps: Props, updatePayload: any[]) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    // key, value 成对出现
    const key = updatePayload[i];
    const newProp = updatePayload[i + 1];
    const oldProp = oldProps[key];
    setProperty(dom, key, newProp, oldProp);
  }
}

export function getUpdatePayload(dom: TaroElement, oldProps: Props, newProps: Props) {
  let i: string;
  let updatePayload: any[] | null = null;

  for (i in oldProps) {
    if (!(i in newProps)) {
      (updatePayload = updatePayload || []).push(i, null);
    }
  }
  const isFormElement = dom instanceof FormElement;
  for (i in newProps) {
    if (oldProps[i] !== newProps[i] || (isFormElement && i === 'value')) {
      // 如果都是 style，且 style 里面的值相等，则无需记录到 payload 中
      if (i === 'style' && isObject(oldProps[i]) && isObject(newProps[i]) && isEqual(oldProps[i], newProps[i]))
        continue;

      (updatePayload = updatePayload || []).push(i, newProps[i]);
    }
  }

  return updatePayload;
}

// function eventProxy (e: CommonEvent) {
//   const el = document.getElementById(e.currentTarget.id)
//   const handlers = el!.__handlers[e.type]
//   handlers[0](e)
// }

function setEvent(dom: TaroElement, name: string, value: unknown, oldValue?: unknown) {
  const isCapture = name.endsWith('Capture');
  let eventName = name.toLowerCase().slice(2);
  if (isCapture) {
    eventName = eventName.slice(0, -7);
  }

  const compName = capitalize(toCamelCase(dom.tagName.toLowerCase()));

  if (eventName === 'click' && compName in internalComponents) {
    eventName = 'tap';
  }

  if (process.env.TARO_ENV === 'tt' && isEnableTTDom()) {
    if (isFunction(oldValue)) {
      (dom as any).removeEventListener(`bind${eventName}`, dom[`__${eventName}__`]);
    }
    if (isFunction(value)) {
      dom[`__${eventName}__`] = eventHandlerTTDom.bind(null, dom, value);
      dom.addEventListener(`bind${eventName}`, dom[`__${eventName}__`], isCapture);
    }
    return;
  }

  if (isFunction(value)) {
    if (oldValue) {
      dom.removeEventListener(eventName, oldValue as any, false);
      dom.addEventListener(eventName, value, { isCapture, sideEffect: false });
    } else {
      dom.addEventListener(eventName, value, isCapture);
    }
  } else {
    dom.removeEventListener(eventName, oldValue as any);
  }
}

function setStyle(style: Style, key: string, value: unknown) {
  if (key[0] === '-') {
    // css variables need not further judgment
    style.setProperty(key, (value as string).toString());
    return;
  }

  style[key] =
    isNumber(value) && IS_NON_DIMENSIONAL.test(key) === false ? convertNumber2PX(value) : value === null ? '' : value;
}

type StyleValue = Record<string, string | number>;
function setProperty(dom: TaroElement, name: string, value: unknown, oldValue?: unknown) {
  name = name === 'className' ? 'class' : name;

  if (name === 'key' || name === 'children' || name === 'ref' || name === 'dangerouslySetInnerHTML') {
    // skip
  } else if (name === 'style') {
    if (process.env.TARO_ENV === 'tt' && isEnableTTDom()) {
      if (isString(value)) {
        dom.setAttribute('style', value);
      } else if (isObject(value)) {
        dom.setAttribute('style', styleObjectToCss(value as StyleValue));
      }
    } else {
      const style = dom.style;
      if (isString(value)) {
        style.cssText = value;
      } else {
        if (isString(oldValue)) {
          style.cssText = '';
          oldValue = null;
        }

        if (isObject<StyleValue>(oldValue)) {
          for (const i in oldValue) {
            if (!(value && i in (value as StyleValue))) {
              setStyle(style, i, '');
            }
          }
        }

        if (isObject<StyleValue>(value)) {
          for (const i in value) {
            if (!oldValue || !isEqual(value[i], (oldValue as StyleValue)[i])) {
              setStyle(style, i, value[i]);
            }
          }
        }
      }
    }
  } else if (isEventName(name)) {
    setEvent(dom, name, value, oldValue);
  } else if (!isFunction(value)) {
    if (process.env.TARO_ENV === 'tt' && isEnableTTDom() && !IS_DATASET_OR_ARIA.test(name)) {
      name = toCamelCase(name);
    }
    if (value == null) {
      dom.removeAttribute(name);
    } else {
      dom.setAttribute(name, value as string);
    }
  }
}

function styleObjectToCss(style: StyleValue) {
  return Object.entries(style)
    .map(([key, value]) => {
      const kebabCaseKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const cssValue =
        typeof value === 'number' && !UNITLESS_PROPERTIES_SET.has(kebabCaseKey)
          ? `${value}px`
          : value === null
            ? ''
            : value;
      return `${kebabCaseKey}: ${cssValue};`;
    })
    .join(' ');
}
