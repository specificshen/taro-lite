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

  it('input 事件只同步 props，等值回写不再下发 setData', () => {
    const { root, el } = setup();

    el.dispatchEvent(fakeFormEvent('input', 'abc'));
    expect(el.props.value).toBe('abc');
    expect(el.value).toBe('abc');
    expect(countWrites(root, 'abc')).toBe(0);

    // React 受控回写相同值：仍然不下发
    el.setAttribute('value', 'abc');
    expect(countWrites(root, 'abc')).toBe(0);
  });

  it('回写值与原生已显示值不等时正常下发', () => {
    const { root, el } = setup();

    el.dispatchEvent(fakeFormEvent('input', 'abc'));
    // 业务截断/改写：与原生值不等，必须下发纠正原生显示
    el.setAttribute('value', 'ab');
    expect(countWrites(root, 'ab')).toBe(1);

    // 纠正后再写相同值，不再重复下发
    el.setAttribute('value', 'ab');
    expect(countWrites(root, 'ab')).toBe(1);
  });

  it('首次写入（未发生输入交互）正常下发', () => {
    const { root, el } = setup();

    el.setAttribute('value', '初始值');
    expect(countWrites(root, '初始值')).toBe(1);
  });

  it('change 事件只改 props，不下发 setData', () => {
    const { root, el } = setup();

    el.dispatchEvent(fakeFormEvent('change', 'abc'));
    expect(el.props.value).toBe('abc');
    expect(countWrites(root, 'abc')).toBe(0);

    // change 上报后等值回写同样跳过
    el.setAttribute('value', 'abc');
    expect(countWrites(root, 'abc')).toBe(0);
  });

  it('removeAttribute 后跟踪值作废，恢复真实下发', () => {
    const { root, el } = setup();

    el.dispatchEvent(fakeFormEvent('input', 'abc'));
    el.removeAttribute('value');
    // 移除后再写回相同值，必须真实下发（原生侧已回落为空串）
    el.setAttribute('value', 'abc');
    expect(countWrites(root, 'abc')).toBe(1);
  });

  it('非字符串值按字符串化后与原生值比较', () => {
    const { root, el } = setup('slider');

    el.setAttribute('value', 50);
    expect(countWrites(root, 50)).toBe(1);

    el.dispatchEvent(fakeFormEvent('change', 50));
    el.dispatchEvent(fakeFormEvent('input', 50));
    el.setAttribute('value', 50);
    expect(countWrites(root, 50)).toBe(1);
  });
});
