import { afterEach, describe, expect, test, vi } from 'vitest';
import * as runtime from '../src/index';

describe('TaroRootElement', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createRoot() {
    const root = runtime.document.createElement('root') as runtime.TaroRootElement;
    root.ctx = {
      setData: vi.fn((_data, cb?: () => void) => cb?.()),
    } as any;
    return root;
  }

  test('performUpdate merges payloads and evaluates payload factories once', () => {
    vi.useFakeTimers();
    const root = createRoot();
    const valueFactory = vi.fn(() => ({ nn: 'view', sid: 'factory-view' }));

    root.enqueueUpdate({ path: 'root.cn.[0].value', value: 'first' });
    root.enqueueUpdate({ path: 'root.cn.[0].value', value: valueFactory });
    root.enqueueUpdate({ path: 'root.cn.[1].value', value: 'second' });

    expect(root.ctx?.setData).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);

    expect(root.ctx?.setData).toHaveBeenCalledTimes(1);
    expect(root.ctx?.setData).toHaveBeenCalledWith(
      {
        'root.cn.[0].value': { nn: 'view', sid: 'factory-view' },
        'root.cn.[1].value': 'second',
      },
      expect.any(Function),
    );
    expect(valueFactory).toHaveBeenCalledTimes(1);
    expect(root.pendingUpdate).toBe(false);
  });

  test('performUpdate removes child paths covered by a childNodes reset', () => {
    vi.useFakeTimers();
    const root = createRoot();
    const resetFactory = vi.fn(() => []);

    root.enqueueUpdate({ path: 'root.cn.[0].cn', value: resetFactory });
    root.enqueueUpdate({ path: 'root.cn.[0].cn.[0]', value: 'ignored-child' });
    root.enqueueUpdate({ path: 'root.cn.[1].value', value: 'kept-sibling' });

    vi.advanceTimersByTime(0);

    expect(root.ctx?.setData).toHaveBeenCalledWith(
      {
        'root.cn.[0].cn': [],
        'root.cn.[1].value': 'kept-sibling',
      },
      expect.any(Function),
    );
  });

  test('flushes update callbacks after every setData callback completes', () => {
    vi.useFakeTimers();
    const root = createRoot();
    const callback = vi.fn();

    root.enqueueUpdateCallback(callback);
    root.enqueueUpdate({ path: 'root.cn.[0].value', value: 'value' });

    vi.advanceTimersByTime(0);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
