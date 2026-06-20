import type { Style, TaroElement } from '@spcsn/taro/runtime';
import { convertNumber2PX, FormElement } from '@spcsn/taro/runtime';
import {
  capitalize,
  internalComponents,
  isFunction,
  isNumber,
  isObject,
  isString,
  toCamelCase,
} from '../../taro-shared';

export type Props = Record<string, unknown>;

type UpdatePayload = unknown[];
type TaroEventHandler = (...args: unknown[]) => unknown;

const IS_NON_DIMENSIONAL = /aspect|acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function isEventName(name: string): boolean {
  return name[0] === 'o' && name[1] === 'n';
}

function isEventHandler(value: unknown): value is TaroEventHandler {
  return isFunction(value);
}

function isEqual(firstValue: unknown, secondValue: unknown): boolean {
  if (firstValue === secondValue) {
    return true;
  }

  if (
    typeof firstValue !== 'object' ||
    firstValue === null ||
    typeof secondValue !== 'object' ||
    secondValue === null
  ) {
    return false;
  }

  const firstObject = firstValue as Record<string, unknown>;
  const secondObject = secondValue as Record<string, unknown>;
  const firstKeys = Object.keys(firstObject);
  const secondKeys = Object.keys(secondObject);

  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  for (const key of firstKeys) {
    if (firstObject[key] !== secondObject[key]) {
      return false;
    }
  }

  return true;
}

export function updateProps(dom: TaroElement, oldProps: Props, newProps: Props) {
  const updatePayload = getUpdatePayload(dom, oldProps, newProps);
  if (updatePayload) {
    updatePropsByPayload(dom, oldProps, updatePayload);
  }
}

export function updatePropsByPayload(dom: TaroElement, oldProps: Props, updatePayload: UpdatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const key = updatePayload[i] as string;
    const newProp = updatePayload[i + 1];
    const oldProp = oldProps[key];
    setProperty(dom, key, newProp, oldProp);
  }
}

export function getUpdatePayload(dom: TaroElement, oldProps: Props, newProps: Props): UpdatePayload | null {
  let i: string;
  let updatePayload: UpdatePayload | null = null;

  for (i in oldProps) {
    if (!(i in newProps)) {
      if (!updatePayload) {
        updatePayload = [];
      }
      updatePayload.push(i, null);
    }
  }
  const isFormElement = dom instanceof FormElement;
  for (i in newProps) {
    if (oldProps[i] !== newProps[i] || (isFormElement && i === 'value')) {
      // 如果都是 style，且 style 里面的值相等，则无需记录到 payload 中
      if (i === 'style' && isObject(oldProps[i]) && isObject(newProps[i]) && isEqual(oldProps[i], newProps[i]))
        continue;

      if (!updatePayload) {
        updatePayload = [];
      }
      updatePayload.push(i, newProps[i]);
    }
  }

  return updatePayload;
}

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

  if (isEventHandler(value)) {
    if (isEventHandler(oldValue)) {
      dom.removeEventListener(eventName, oldValue, false);
      dom.addEventListener(eventName, value, { capture: isCapture, sideEffect: false });
    } else {
      dom.addEventListener(eventName, value, isCapture);
    }
    return;
  }

  if (isEventHandler(oldValue)) {
    dom.removeEventListener(eventName, oldValue);
  }
}

function setStyle(style: Style, key: string, value: unknown) {
  if (key[0] === '-') {
    // css variables need not further judgment
    style.setProperty(key, (value as string).toString());
    return;
  }

  const styleValue: string | number | null =
    isNumber(value) && IS_NON_DIMENSIONAL.test(key) === false
      ? convertNumber2PX(value)
      : value === null
        ? ''
        : (value as string | number);

  (style as Record<string, string | number | null>)[key] = styleValue;
}

type StyleValue = Record<string, string | number>;
function setProperty(dom: TaroElement, name: string, value: unknown, oldValue?: unknown) {
  name = name === 'className' ? 'class' : name;

  if (name === 'key' || name === 'children' || name === 'ref' || name === 'dangerouslySetInnerHTML') {
    // skip
  } else if (name === 'style') {
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
  } else if (isEventName(name)) {
    setEvent(dom, name, value, oldValue);
  } else if (!isFunction(value)) {
    if (value == null) {
      dom.removeAttribute(name);
    } else {
      dom.setAttribute(name, value as string);
    }
  }
}
