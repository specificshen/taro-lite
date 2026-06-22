import { describe, expect, it } from 'vitest';
import { AnchorElement } from '../../src/runtime/dom/anchor-element';
import { TaroDocument } from '../../src/runtime/dom/document';
import { TaroElement } from '../../src/runtime/dom/element';
import { FormElement } from '../../src/runtime/dom/form';
import { TaroRootElement } from '../../src/runtime/dom/root';
import { TaroText } from '../../src/runtime/dom/text';

describe('TaroDocument', () => {
  it('creates a plain element', () => {
    const doc = new TaroDocument();
    const el = doc.createElement('view');
    expect(el).toBeInstanceOf(TaroElement);
    expect(el.nodeName).toBe('view');
    expect(el.tagName).toBe('VIEW');
  });

  it('creates a root element', () => {
    const doc = new TaroDocument();
    const el = doc.createElement('root');
    expect(el).toBeInstanceOf(TaroRootElement);
  });

  it('creates a form element for controlled components', () => {
    const doc = new TaroDocument();
    const el = doc.createElement('input');
    expect(el).toBeInstanceOf(FormElement);
    expect(el.nodeName).toBe('input');
  });

  it('creates an anchor element', () => {
    const doc = new TaroDocument();
    const el = doc.createElement('a');
    expect(el).toBeInstanceOf(AnchorElement);
    expect(el.nodeName).toBe('a');
  });

  it('creates text and comment nodes', () => {
    const doc = new TaroDocument();
    const text = doc.createTextNode('hello');
    expect(text).toBeInstanceOf(TaroText);
    expect(text.nodeValue).toBe('hello');

    const comment = doc.createComment();
    expect(comment).toBeInstanceOf(TaroText);
    expect(comment.nodeName).toBe('comment');
  });

  it('finds elements by id via eventSource', () => {
    const doc = new TaroDocument();
    const el = doc.createElement('view');
    el.setAttribute('id', 'target');

    expect(doc.getElementById('target')).toBe(el);
    expect(doc.querySelector('#target')).toBe(el);
    expect(doc.querySelector('.cls')).toBeNull();
  });

  it('createElementNS delegates to createElement', () => {
    const doc = new TaroDocument();
    const el = doc.createElementNS('http://www.w3.org/2000/svg', 'view');
    expect(el.nodeName).toBe('view');
  });
});
