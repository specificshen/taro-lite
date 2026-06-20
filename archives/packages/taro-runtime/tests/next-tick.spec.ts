import { afterEach, describe, expect, test, vi } from 'vitest';
import * as runtime from '../src/index';

describe('nextTick', () => {
  afterEach(() => {
    runtime.Current.router = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('falls back to timer when router is unavailable', () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    runtime.nextTick(callback);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('joins the pending root update callback queue', () => {
    const root = runtime.document.createElement('root') as runtime.TaroRootElement;
    root.id = 'next-tick-page';
    root.pendingUpdate = true;
    const enqueueUpdateCallback = vi.spyOn(root, 'enqueueUpdateCallback');
    const callback = vi.fn();
    runtime.Current.router = {
      $taroPath: 'next-tick-page',
      path: '/next-tick-page',
      params: {},
    } as any;

    runtime.nextTick(callback);

    expect(enqueueUpdateCallback).toHaveBeenCalledWith(callback, undefined);
    expect(callback).not.toHaveBeenCalled();
  });

  test('waits for a later pending root update before timing out', () => {
    vi.useFakeTimers();
    const root = runtime.document.createElement('root') as runtime.TaroRootElement;
    root.id = 'next-tick-delayed-page';
    const callback = vi.fn();
    runtime.Current.router = {
      $taroPath: 'next-tick-delayed-page',
      path: '/next-tick-delayed-page',
      params: {},
    } as any;

    runtime.nextTick(callback);

    root.pendingUpdate = true;
    vi.advanceTimersByTime(20);
    root.flushUpdateCallback();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('falls back after waiting for pending update timeout', () => {
    vi.useFakeTimers();
    const root = runtime.document.createElement('root') as runtime.TaroRootElement;
    root.id = 'next-tick-timeout-page';
    const callback = vi.fn();
    runtime.Current.router = {
      $taroPath: 'next-tick-timeout-page',
      path: '/next-tick-timeout-page',
      params: {},
    } as any;

    runtime.nextTick(callback);

    vi.advanceTimersByTime(121);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
