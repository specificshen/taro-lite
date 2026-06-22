import { describe, expect, it } from 'vitest';
import { TaroElement } from '../../src/runtime/dom/element';
import { TaroText } from '../../src/runtime/dom/text';
import { hydrate } from '../../src/runtime/hydrate';
import { Shortcuts } from '../../src/runtime/shortcuts';

describe('hydrate', () => {
  it('serializes a text node', () => {
    const text = new TaroText('hello');
    const data = hydrate(text);

    expect(data[Shortcuts.Text]).toBe('hello');
    expect(data[Shortcuts.NodeName]).toBeDefined();
    expect(data.sid).toBeDefined();
  });

  it('serializes an element with props, class and style', () => {
    const el = new TaroElement();
    el.nodeName = 'view';
    el.setAttribute('id', 'root');
    el.setAttribute('class', 'container');
    el.setAttribute('style', 'color: red;');

    const data = hydrate(el);

    expect(data[Shortcuts.NodeName]).toBeDefined();
    expect(data.sid).toBeDefined();
    expect(data[Shortcuts.Class]).toBe('container');
    expect(data[Shortcuts.Style]).toBe('color: red;');
    expect(data.uid).toBeDefined();
  });

  it('filters comment children and serializes real children', () => {
    const parent = new TaroElement();
    parent.nodeName = 'view';

    const child = new TaroElement();
    child.nodeName = 'text';

    const comment = new TaroText('');
    comment.nodeName = 'comment';

    parent.appendChild(child);
    parent.appendChild(comment);

    const data = hydrate(parent);
    const children = (data as Record<string, unknown>)[Shortcuts.Childnodes] as Array<Record<string, unknown>>;

    expect(children).toHaveLength(1);
    expect(children[0][Shortcuts.NodeName]).toBeDefined();
  });

  it('serializes nested children recursively', () => {
    const parent = new TaroElement();
    parent.nodeName = 'view';

    const child = new TaroElement();
    child.nodeName = 'text';
    const text = new TaroText('nested');
    child.appendChild(text);
    parent.appendChild(child);

    const data = hydrate(parent);
    const children = (data as Record<string, unknown>)[Shortcuts.Childnodes] as Array<Record<string, unknown>>;

    expect(children).toHaveLength(1);
    const grandchildren = children[0][Shortcuts.Childnodes] as Array<Record<string, unknown>>;
    expect(grandchildren).toHaveLength(1);
    expect(grandchildren[0][Shortcuts.Text]).toBe('nested');
  });
});
