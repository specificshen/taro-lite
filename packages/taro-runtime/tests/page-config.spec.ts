import { afterEach, describe, expect, test, vi } from 'vitest';
import * as runtime from '../src/index';

describe('createPageConfig', () => {
  afterEach(() => {
    runtime.Current.app = null;
    runtime.Current.page = null;
    runtime.Current.router = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createPage(pageRoute = 'pages/detail/index') {
    return {
      route: pageRoute,
      __route__: pageRoute,
      config: {},
      setData: vi.fn((_data, cb?: () => void) => cb?.()),
    } as any;
  }

  test('uses unique page path for router lifecycle event keys across same-route instances', () => {
    vi.useFakeTimers();
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);
    vi.spyOn(runtime.TaroRootElement.prototype, 'performUpdate').mockImplementation(function (this) {
      this.pendingUpdate = false;
    });

    runtime.setCurrentApp({
      mount: vi.fn((_component, id: string, cb: () => void) => {
        const root = runtime.document.createElement('root') as runtime.TaroRootElement;
        root.id = id;
        cb();
      }),
      unmount: vi.fn((_id, cb?: () => void) => cb?.()),
    } as any);

    const config = runtime.createPageConfig({}, 'pages/detail/index');
    const firstPage = createPage();
    const secondPage = createPage();

    config.onLoad.call(firstPage, { id: 'first' });
    const firstRouter = runtime.Current.router!;
    config.onLoad.call(secondPage, { id: 'second' });
    const secondRouter = runtime.Current.router!;

    expect(firstRouter.$taroPath).toBe('pages/detail/index?id=first&$taroTimestamp=1000');
    expect(secondRouter.$taroPath).toBe('pages/detail/index?id=second&$taroTimestamp=2000');
    expect(firstRouter.onReady).toBe(runtime.getOnReadyEventKey(firstRouter.$taroPath));
    expect(firstRouter.onShow).toBe(runtime.getOnShowEventKey(firstRouter.$taroPath));
    expect(firstRouter.onHide).toBe(runtime.getOnHideEventKey(firstRouter.$taroPath));
    expect(secondRouter.onReady).toBe(runtime.getOnReadyEventKey(secondRouter.$taroPath));
    expect(secondRouter.onShow).toBe(runtime.getOnShowEventKey(secondRouter.$taroPath));
    expect(secondRouter.onHide).toBe(runtime.getOnHideEventKey(secondRouter.$taroPath));
    expect(firstRouter.onReady).not.toBe(secondRouter.onReady);
    expect(firstRouter.onShow).not.toBe(secondRouter.onShow);
    expect(firstRouter.onHide).not.toBe(secondRouter.onHide);
  });
});
