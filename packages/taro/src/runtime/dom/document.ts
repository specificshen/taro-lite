import { A, COMMENT, DOCUMENT_ELEMENT_NAME, ROOT_STR } from '../constants';
import { controlledComponent } from '../controlled-components';
import { TaroElement } from '../dom/element';
import { eventSource } from '../dom/event-source';
import { FormElement } from '../dom/form';
import { NodeType } from '../dom/node-types';
import { TaroRootElement } from '../dom/root';
import { TaroText } from '../dom/text';
import env from '../env';
import { isUndefined, toCamelCase } from '../shared-primitives';
import { AnchorElement } from './anchor-element';
import { TransferElement } from './transfer';

export class TaroDocument extends TaroElement {
  public documentElement!: TaroElement;
  public head!: TaroElement;
  public body!: TaroElement;
  cookie?: string;

  public constructor() {
    super();
    this.nodeType = NodeType.DOCUMENT_NODE;
    this.nodeName = DOCUMENT_ELEMENT_NAME;
  }

  public createElement(type: string): TaroElement | TaroRootElement | FormElement {
    const nodeName = type.toLowerCase();

    let element: TaroElement;
    switch (true) {
      case nodeName === ROOT_STR:
        element = new TaroRootElement();
        return element;
      case controlledComponent.has(nodeName):
        element = new FormElement();
        break;
      case nodeName === A:
        element = new AnchorElement();
        break;
      case nodeName === 'page-meta':
      case nodeName === 'navigation-bar':
        element = new TransferElement(toCamelCase(nodeName));
        break;
      default:
        element = new TaroElement();
        break;
    }

    element.nodeName = nodeName;
    element.tagName = type.toUpperCase();

    return element;
  }

  // Minimal createElementNS shim — kept as no-op for renderers that
  // attempt to mount into an SVG container before falling back.
  public createElementNS(_svgNS: string, type: string): TaroElement | TaroRootElement | FormElement {
    return this.createElement(type);
  }

  public createTextNode(text: string): TaroText {
    return new TaroText(text);
  }

  public getElementById<T extends TaroElement>(id: string | undefined | null): T | null {
    const el = eventSource.get(id);
    return isUndefined(el) ? null : (el as T);
  }

  public querySelector<T extends TaroElement>(query: string): T | null {
    // Minimal id-selector shim — only `#id` is supported.
    if (/^#/.test(query)) {
      return this.getElementById<T>(query.slice(1));
    }
    return null;
  }

  public querySelectorAll() {
    // fake hack
    return [];
  }

  // 注意：createComment 返回空文本节点作为占位；hydrate 阶段不能贸然过滤空文本节点，
  // 因为 React reconciler 可能随后更新其内容，移除会导致 setData 路径在视图中找不到对应节点。
  public createComment(): TaroText {
    const textnode = new TaroText('');
    textnode.nodeName = COMMENT;
    return textnode;
  }

  get defaultView() {
    return env.window;
  }
}
