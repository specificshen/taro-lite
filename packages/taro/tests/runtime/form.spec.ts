import { describe, expect, it } from 'bun:test';
import { TaroDocument } from '../../src/runtime/dom/document';
import type { TaroEvent } from '../../src/runtime/dom/event';
import type { FormElement } from '../../src/runtime/dom/form';
import type { TaroRootElement } from '../../src/runtime/dom/root';

/**
 * 读取 root 上累积的 setData 载荷（无 ctx 时 performUpdate 不会触发，载荷只入队）。
 * 注意属性名在 payload path 里会被压缩成别名（value → p13 之类），
 * 因此断言一律按载荷的 value 过滤，不匹配 path。
 */
const countWrites = (root: TaroRootElement, value: unknown) =>
  (root as unknown as { updatePayloads: { path: string; value: unknown }[] }).updatePayloads.filter(
    (p) => p.value === value,
  ).length;

const fakeFormEvent = (type: string, value: unknown) =>
  ({ type, mpEvent: { detail: { value } } }) as unknown as TaroEvent;

describe('FormElement 受控 value 下发', () => {
  const setup = (nodeName = 'textarea') => {
    const doc = new TaroDocument();
    const root = doc.createElement('root') as TaroRootElement;
    const el = doc.createElement(nodeName) as FormElement;
    root.appendChild(el);
    return { root, el };
  };

  it('input 事件同步 props 并真实下发 setData 确认原生值', () => {
    const { root, el } = setup();

    el.dispatchEvent(fakeFormEvent('input', 'abc'));
    expect(el.props.value).toBe('abc');
    expect(el.value).toBe('abc');
    expect(countWrites(root, 'abc')).toBe(1);
  });

  it('受控回写不做等值跳过，一律真实下发', () => {
    const { root, el } = setup();

    // 回归约束：曾按"原生已显示值"跳过等值回写（lastNativeValue），
    // 在 AutocompleteInput 等场景导致输入被旧值整体回填，已回退。
    el.dispatchEvent(fakeFormEvent('input', 'abc'));
    el.setAttribute('value', 'abc');
    expect(countWrites(root, 'abc')).toBe(2);
  });

  it('change 事件只改 props，不下发 setData', () => {
    const { root, el } = setup();

    el.dispatchEvent(fakeFormEvent('change', 'abc'));
    expect(el.props.value).toBe('abc');
    expect(countWrites(root, 'abc')).toBe(0);
  });

  it('首次写入（未发生输入交互）正常下发', () => {
    const { root, el } = setup();

    el.setAttribute('value', '初始值');
    expect(countWrites(root, '初始值')).toBe(1);
  });

  it('非字符串值照常下发', () => {
    const { root, el } = setup('slider');

    el.setAttribute('value', 50);
    expect(countWrites(root, 50)).toBe(1);

    el.dispatchEvent(fakeFormEvent('change', 50));
    el.dispatchEvent(fakeFormEvent('input', 50));
    expect(countWrites(root, 50)).toBe(2);
  });
});
