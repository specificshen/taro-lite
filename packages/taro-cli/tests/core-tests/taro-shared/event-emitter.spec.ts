import { describe, expect, it, vi } from 'vitest';
import { Events } from '../../../../taro/src/runtime/event-emitter';

describe('taro-shared event-emitter', () => {
  it('triggers registered callbacks', () => {
    const events = new Events();
    const cb = vi.fn();
    events.on('foo', cb);
    events.trigger('foo', 1, 2);
    expect(cb).toHaveBeenCalledWith(1, 2);
  });

  it('supports multiple events separated by comma', () => {
    const events = new Events();
    const cb = vi.fn();
    events.on('foo,bar', cb);
    events.trigger('foo');
    events.trigger('bar');
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('removes callback with off', () => {
    const events = new Events();
    const cb = vi.fn();
    events.on('foo', cb);
    events.off('foo', cb);
    events.trigger('foo');
    expect(cb).not.toHaveBeenCalled();
  });

  it('clears all callbacks when off is called without arguments', () => {
    const events = new Events();
    const cb = vi.fn();
    events.on('foo', cb);
    events.off();
    events.trigger('foo');
    expect(cb).not.toHaveBeenCalled();
  });

  it('only triggers once callback one time', () => {
    const events = new Events();
    const cb = vi.fn();
    events.once('foo', cb);
    events.trigger('foo');
    events.trigger('foo');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('passes context to callback', () => {
    const events = new Events();
    const ctx = { name: 'test' };
    const cb = vi.fn(function (this: typeof ctx) {
      return this.name;
    });
    events.on('foo', cb, ctx);
    events.trigger('foo');
    expect(cb).toHaveReturnedWith('test');
  });
});
