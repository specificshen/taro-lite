import { TaroElement } from '../dom/element';
import { TaroNode } from '../dom/node';
import { getBoundingClientRectImpl, getTemplateContent } from './element';
import { cloneNode, contains } from './node';

declare const ENABLE_CLONE_NODE: boolean;
declare const ENABLE_CONTAINS: boolean;

declare const ENABLE_SIZE_APIS: boolean;
declare const ENABLE_TEMPLATE_CONTENT: boolean;

if (ENABLE_CLONE_NODE) {
  TaroNode.extend('cloneNode', cloneNode);
}

if (ENABLE_CONTAINS) {
  TaroNode.extend('contains', contains);
}

if (ENABLE_SIZE_APIS) {
  TaroElement.extend('getBoundingClientRect', getBoundingClientRectImpl);
}

if (ENABLE_TEMPLATE_CONTENT) {
  TaroElement.extend('content', {
    get() {
      return getTemplateContent(this as unknown as TaroElement);
    },
  });
}
