import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Current, getCurrentInstance, setCurrentApp, whenAppReady } from '../../src/runtime/current';
import { TaroDocument } from '../../src/runtime/dom/document';
import { TaroRootElement } from '../../src/runtime/dom/root';
import env from '../../src/runtime/env';
import { Events } from '../../src/runtime/event-emitter';
import { nextTick } from '../../src/runtime/next-tick';

describe('runtime core', () => {
  describe('env', () => {
    it('exposes window and document placeholders', () => {
      expect(env.window).toBeDefined();
      expect(env.document).toBeDefined();
    });
  });

  describe('Current', () => {
    beforeEach(() => {
      Current.app = null;
      Current.router = null;
      Current.page = null;
    });

    it('getCurrentInstance returns the Current singleton', () => {
      expect(getCurrentInstance()).toBe(Current);
    });

    it('setCurrentApp triggers pending callbacks', () => {
      const app = { mount: vi.fn() } as unknown as import('../../src/runtime/dsl/instance').AppInstance;
      const cb = vi.fn();
      whenAppReady(cb);
      expect(cb).not.toHaveBeenCalled();
      setCurrentApp(app);
      expect(cb).toHaveBeenCalledWith(app);
    });

    it('whenAppReady fires immediately if app already set', () => {
      const app = { mount: vi.fn() } as unknown as import('../../src/runtime/dsl/instance').AppInstance;
      setCurrentApp(app);
      const cb = vi.fn();
      whenAppReady(cb);
      expect(cb).toHaveBeenCalledWith(app);
    });
  });

  describe('Events', () => {
    it('on/trigger invokes callbacks', () => {
      const events = new Events();
      const cb = vi.fn();
      events.on('foo', cb);
      events.trigger('foo', 1, 2);
      expect(cb).toHaveBeenCalledWith(1, 2);
    });

    it('supports comma-separated event names', () => {
      const events = new Events();
      const cb = vi.fn();
      events.on('foo,bar', cb);
      events.trigger('foo');
      events.trigger('bar');
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it('once removes itself after trigger', () => {
      const events = new Events();
      const cb = vi.fn();
      events.once('foo', cb);
      events.trigger('foo');
      events.trigger('foo');
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('off removes matching callbacks', () => {
      const events = new Events();
      const cb = vi.fn();
      events.on('foo', cb);
      events.off('foo', cb);
      events.trigger('foo');
      expect(cb).not.toHaveBeenCalled();
    });

    it('off without arguments clears all callbacks', () => {
      const events = new Events();
      const cb = vi.fn();
      events.on('foo', cb);
      events.off();
      events.trigger('foo');
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('nextTick', () => {
    const originalDocument = env.document;

    afterEach(() => {
      env.document = originalDocument;
      Current.router = null;
    });

    it('enqueues callback on pending page element', () => {
      const doc = new TaroDocument();
      env.document = doc as unknown as typeof env.document;
      const root = doc.createElement('root') as TaroRootElement;
      root.setAttribute('id', 'pages/index');
      root.pendingUpdate = true;

      Current.router = { $taroPath: 'pages/index' } as unknown as import('../../src/runtime/current').Router;

      const cb = vi.fn();
      nextTick(cb);
      root.flushUpdateCallback();
      expect(cb).toHaveBeenCalled();
    });

    it('falls back to setTimeout when router is null', async () => {
      Current.router = null;
      const cb = vi.fn();
      nextTick(cb);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(cb).toHaveBeenCalled();
    });
  });
});
