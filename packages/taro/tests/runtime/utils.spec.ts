import { describe, expect, it } from 'vitest';
import { TaroElement } from '../../src/runtime/dom/element';
import { TaroText } from '../../src/runtime/dom/text';
import {
  extend,
  incrementId,
  isComment,
  isElement,
  isHasExtractProp,
  isParentBound,
  isText,
  shortcutAttr,
} from '../../src/runtime/utils';

describe('runtime/utils', () => {
  describe('incrementId', () => {
    it('generates sequential letter-based ids', () => {
      const nextId = incrementId();
      expect(nextId()).toBe('AA');
      expect(nextId()).toBe('AB');
      expect(nextId()).toBe('AC');
    });
  });

  describe('node type guards', () => {
    it('isElement recognizes TaroElement', () => {
      const el = new TaroElement();
      expect(isElement(el)).toBe(true);
      expect(isText(el)).toBe(false);
    });

    it('isText recognizes TaroText', () => {
      const text = new TaroText('hello');
      expect(isText(text)).toBe(true);
      expect(isElement(text)).toBe(false);
    });

    it('isComment recognizes comment placeholder', () => {
      const text = new TaroText('');
      text.nodeName = 'comment';
      expect(isComment(text)).toBe(true);

      const el = new TaroElement();
      expect(isComment(el)).toBe(false);
    });
  });

  describe('isHasExtractProp', () => {
    it('returns false for only class/style/id/data-* props', () => {
      const el = new TaroElement();
      el.props = { class: 'a', style: 'b', id: 'c', 'data-x': 1 };
      expect(isHasExtractProp(el)).toBe(false);
    });

    it('returns true when a non-extract prop exists', () => {
      const el = new TaroElement();
      el.props = { class: 'a', onClick: () => {} };
      expect(isHasExtractProp(el)).toBe(true);
    });
  });

  describe('isParentBound', () => {
    it('detects bound ancestor event handler', () => {
      const parent = new TaroElement();
      parent.nodeName = 'view';
      (parent as unknown as { __handlers: Record<string, unknown[]> }).__handlers = { click: [() => {}] };

      const child = new TaroElement();
      parent.appendChild(child);

      expect(isParentBound(child, 'click')).toBe(true);
      expect(isParentBound(child, 'longpress')).toBe(false);
    });

    it('stops at root boundary', () => {
      const root = new TaroElement();
      root.nodeName = 'root';

      const child = new TaroElement();
      root.appendChild(child);

      expect(isParentBound(child, 'click')).toBe(false);
    });
  });

  describe('shortcutAttr', () => {
    it('maps known attribute names to shortcuts', () => {
      expect(shortcutAttr('style')).toBe('st');
      expect(shortcutAttr('id')).toBe('uid');
      expect(shortcutAttr('class')).toBe('cl');
      expect(shortcutAttr('foo')).toBe('foo');
    });
  });

  describe('extend', () => {
    it('adds method to constructor prototype', () => {
      class Foo {}
      extend(Foo, 'bar', function (this: Foo) {
        return this;
      });

      const foo = new Foo();
      expect(typeof (foo as unknown as { bar: () => Foo }).bar).toBe('function');
    });
  });
});
