import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';
import { EVENT_CALLBACK_RESULT } from '../src/constants';
import { eventHandler } from '../src/dom/event';
import * as runtime from '../src/index';

describe('event', () => {
  const document = runtime.document;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    process.env.FRAMEWORK = '';
  });

  function createMpEvent(type: string, id: string, detail: Record<string, unknown> = {}) {
    return {
      type,
      target: { dataset: {}, id },
      currentTarget: { dataset: {}, id },
      detail,
    };
  }

  test('can addEventListener', () => {
    const div = document.createElement('div');
    const spy = vi.fn();
    div.addEventListener('tap', spy, null);
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    // mini program event system will do this for us
    div.dispatchEvent(event);
  });

  test('event once should work', () => {
    const div = document.createElement('div');
    const spy = vi.fn();
    div.addEventListener('tap', spy, { once: true });
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(1);
  });

  test('可以多次 dispatchEvent', () => {
    const div = document.createElement('div');
    const spy = vi.fn();
    div.addEventListener('tap', spy, null);
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(2);
  });

  test('同一事件可以添加多个 handlers', () => {
    const div = document.createElement('div');
    const spy = vi.fn();
    const spy2 = vi.fn();
    div.addEventListener('tap', spy, null);
    div.addEventListener('tap', spy2, null);
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
  });

  test('remove 一个 handler 不会影响其它 handler', () => {
    const div = document.createElement('div');
    const spy = vi.fn();
    const spy2 = vi.fn();
    div.addEventListener('tap', spy, null);
    div.addEventListener('tap', spy2, null);
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    div.removeEventListener('tap', spy);
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(2);
  });

  test('添加事件名会被小写化', () => {
    const div = document.createElement('div');
    const spy = vi.fn();
    const spy2 = vi.fn();
    div.addEventListener('tap', spy, null);
    div.addEventListener('tap', spy2, null);
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    div.removeEventListener('tap', spy);
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(2);
  });

  test('remove 空事件也不会报错', () => {
    const div = document.createElement('div');
    expect(() => {
      div.removeEventListener('tap', vi.fn());
    }).not.toThrow();
  });

  test('可以阻止冒泡', () => {
    const container = document.createElement('container');
    const div = document.createElement('div');
    container.appendChild(div);
    const containerSpy = vi.fn();
    const divSpy = vi.fn();
    container.addEventListener('tap', containerSpy, null);
    div.addEventListener(
      'tap',
      (e: any) => {
        divSpy();
        e.stopPropagation();
      },
      null,
    );
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    container.dispatchEvent(event); // bubble event
    expect(divSpy).toBeCalledTimes(1);
    expect(containerSpy).toBeCalledTimes(0);
  });

  test('非冒泡事件不会在父元素触发', () => {
    const eventName = 'unknown';
    const container = document.createElement('container');
    const div = document.createElement('div');
    container.appendChild(div);
    const containerSpy = vi.fn();
    const divSpy = vi.fn();
    container.addEventListener(eventName, containerSpy, null);
    div.addEventListener(eventName, divSpy, null);
    const event = runtime.createEvent(
      {
        type: eventName,
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    container.dispatchEvent(event); // bubble event
    expect(divSpy).toBeCalledTimes(1);
    expect(containerSpy).toBeCalledTimes(1);
  });

  test('preventDefault', () => {
    const container = document.createElement('container');
    const div = document.createElement('div');
    container.appendChild(div);
    const containerSpy = vi.fn();
    const divSpy = vi.fn();
    container.addEventListener('tap', containerSpy, null);
    div.addEventListener(
      'tap',
      (e: any) => {
        divSpy();
        e.preventDefault();
      },
      null,
    );
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    expect(divSpy).toBeCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  test('stopImmediatePropagation()', () => {
    const div = document.createElement('div');
    const spy = vi.fn();
    const spy2 = vi.fn();
    div.addEventListener('tap', spy2, null);
    div.addEventListener(
      'tap',
      (e: any) => {
        spy();
        e.stopImmediatePropagation();
      },
      null,
    );
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(0);
  });

  test('dispatchEvent 也会被小写', () => {
    const div = document.createElement('div');
    const spy = vi.fn();
    const spy2 = vi.fn();
    div.addEventListener('tap', spy2, null);
    div.addEventListener(
      'tap',
      (e: any) => {
        spy();
        e.stopImmediatePropagation();
      },
      null,
    );
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(0);
  });

  test('可以发送没有监听的事件', () => {
    const container = document.createElement('container');
    const div = document.createElement('div');
    container.appendChild(div);
    const containerSpy = vi.fn();
    const divSpy = vi.fn();
    const event = runtime.createEvent(
      {
        type: 'tap',
        detail: {},
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
      },
      div,
    );
    div.dispatchEvent(event);
    container.dispatchEvent(event); // bubble event
    expect(divSpy).toBeCalledTimes(0);
    expect(containerSpy).toBeCalledTimes(0);
  });

  test('TaroEvent constructor with options', () => {
    const event = new runtime.TaroEvent('tap', { bubbles: true, cancelable: false });
    expect(event.type).toBe('tap');
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(false);
    expect(event._stop).toBe(false);
    expect(event._end).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(event.button).toBe(0);
    expect(typeof event.timeStamp).toBe('number');
  });

  test('TaroEvent constructor without options', () => {
    const event = new runtime.TaroEvent('TAP', { bubbles: false, cancelable: false });
    expect(event.type).toBe('tap'); // should be lowercase
    expect(event.bubbles).toBe(false);
    expect(event.cancelable).toBe(false);
  });

  test('TaroEvent target getter with mpEvent', () => {
    const mpEvent = {
      type: 'tap',
      target: {
        dataset: { sid: 'test-id', customData: 'value' },
        id: 'target-id',
      },
      currentTarget: { dataset: {}, id: '' },
      detail: { x: 10, y: 20 },
    };

    // Create element and add to document
    const element = runtime.document.createElement('div');
    element.id = 'test-id';
    element.dataset.customData = 'value';
    runtime.document.body.appendChild(element);

    const event = new runtime.TaroEvent('tap', { bubbles: true, cancelable: true }, mpEvent);
    const target = event.target;

    expect(target.dataset).toEqual({ customData: 'value' });
    expect(target.x).toBe(10);
    expect(target.y).toBe(20);

    // Should cache the target
    expect(event.target).toBe(target);
  });

  test('TaroEvent currentTarget getter with different elements', () => {
    const mpEvent = {
      type: 'tap',
      target: { dataset: { sid: 'target-id' }, id: 'target-id' },
      currentTarget: { dataset: { sid: 'current-id' }, id: 'current-id' },
      detail: { value: 'test' },
    };

    // Create elements
    const targetElement = runtime.document.createElement('div');
    targetElement.id = 'target-id';
    targetElement.dataset.role = 'target';
    runtime.document.body.appendChild(targetElement);

    const currentElement = runtime.document.createElement('div');
    currentElement.id = 'current-id';
    currentElement.dataset.role = 'current';
    runtime.document.body.appendChild(currentElement);

    const event = new runtime.TaroEvent('tap', { bubbles: true, cancelable: true }, mpEvent);
    const currentTarget = event.currentTarget;

    expect(currentTarget.dataset).toEqual({ customData: 'value', role: 'current' });
    expect(currentTarget.value).toBe('test');

    // Should cache the currentTarget
    expect(event.currentTarget).toBe(currentTarget);
  });

  test('TaroEvent currentTarget falls back to target when same element', () => {
    const mpEvent = {
      type: 'tap',
      target: { dataset: { sid: 'same-id' }, id: 'same-id' },
      currentTarget: { dataset: { sid: 'same-id' }, id: 'same-id' },
      detail: {},
    };

    const element = runtime.document.createElement('div');
    element.id = 'same-id';
    runtime.document.body.appendChild(element);

    const event = new runtime.TaroEvent('tap', { bubbles: true, cancelable: true }, mpEvent);

    expect(event.currentTarget).toBe(event.target);
  });

  test('createEvent with confirm type and input node', () => {
    const input = runtime.document.createElement('input');
    const mpEvent = {
      type: 'confirm',
      target: { dataset: {}, id: '' },
      currentTarget: { dataset: {}, id: '' },
      detail: {},
    };

    const event = runtime.createEvent(mpEvent, input);
    expect((event as any).keyCode).toBe(13);
  });

  test('createEvent copies all properties except reserved ones', () => {
    const mpEvent = {
      type: 'tap',
      target: { dataset: {}, id: '' },
      currentTarget: { dataset: {}, id: '' },
      timeStamp: 12345,
      customProp: 'test',
      detail: {},
    };

    const event = runtime.createEvent(mpEvent);
    expect((event as any).customProp).toBe('test');
    expect(event.timeStamp).not.toBe(12345); // should use Date.now()
  });

  test('eventHandler with basic mpEvent', () => {
    const mockHooks = {
      call: vi.fn(),
      isExist: vi.fn(() => false),
    };

    // Mock hooks globally
    const originalHooks = runtime.hooks;
    Object.assign(runtime.hooks, mockHooks);

    const element = runtime.document.createElement('div');
    element.id = 'test-element';
    runtime.document.body.appendChild(element);

    const mpEvent = {
      type: 'tap',
      target: { dataset: {}, id: 'test-element' },
      currentTarget: { dataset: {}, id: 'test-element' },
      detail: {},
    };

    eventHandler(mpEvent);

    expect(mockHooks.call).toHaveBeenCalledWith('modifyMpEventImpl', mpEvent);
    expect(mockHooks.isExist).toHaveBeenCalledWith('batchedEventUpdates');

    // Restore original hooks
    Object.assign(runtime.hooks, originalHooks);
  });
  test('eventHandler with missing target', () => {
    const mockHooks = {
      call: vi.fn(),
      isExist: vi.fn(() => false),
    };

    const originalHooks = runtime.hooks;
    Object.assign(runtime.hooks, mockHooks);

    const mpEvent = {
      type: 'tap',
      detail: {},
      target: null,
      currentTarget: null,
    } as any;

    // Should handle gracefully when target is missing
    expect(() => eventHandler(mpEvent)).not.toThrow();

    Object.assign(runtime.hooks, originalHooks);
  });

  test('eventHandler with batchedEventUpdates and non-bubble events', () => {
    const mockBatchedEventUpdates = vi.fn((fn) => fn());
    const mockHooks = {
      call: vi.fn((name, ...args) => {
        if (name === 'batchedEventUpdates') {
          return mockBatchedEventUpdates(args[0]);
        }
        if (name === 'isBubbleEvents') {
          return false; // non-bubble event
        }
        return undefined;
      }),
      isExist: vi.fn((name) => name === 'batchedEventUpdates'),
    };

    const originalHooks = runtime.hooks;
    Object.assign(runtime.hooks, mockHooks);

    const element = runtime.document.createElement('div');
    element.id = 'batch-element';
    runtime.document.body.appendChild(element);

    const mpEvent = {
      type: 'load',
      target: { dataset: {}, id: 'batch-element' },
      currentTarget: { dataset: {}, id: 'batch-element' },
      detail: {},
    };

    eventHandler(mpEvent);

    expect(mockHooks.isExist).toHaveBeenCalledWith('batchedEventUpdates');
    expect(mockHooks.call).toHaveBeenCalledWith('isBubbleEvents', 'load');
    expect(mockBatchedEventUpdates).toHaveBeenCalled();

    Object.assign(runtime.hooks, originalHooks);
  });

  test('eventHandler with touchmove and catchMove', () => {
    const mockHooks = {
      call: vi.fn((name) => {
        if (name === 'isBubbleEvents') return true;
        return undefined;
      }),
      isExist: vi.fn((name) => name === 'batchedEventUpdates'),
    };

    const originalHooks = runtime.hooks;
    Object.assign(runtime.hooks, mockHooks);

    const element = runtime.document.createElement('div');
    element.id = 'touchmove-element';
    element.props = { catchMove: true };
    runtime.document.body.appendChild(element);

    const mpEvent = {
      type: 'touchmove',
      target: { dataset: {}, id: 'touchmove-element' },
      currentTarget: { dataset: {}, id: 'touchmove-element' },
      detail: {},
    };

    eventHandler(mpEvent);

    expect(mockHooks.call).toHaveBeenCalledWith('isBubbleEvents', 'touchmove');

    Object.assign(runtime.hooks, originalHooks);
  });

  test('eventHandler with EVENT_CALLBACK_RESULT', () => {
    const mockHooks = {
      call: vi.fn(),
      isExist: vi.fn(() => false),
    };

    const originalHooks = runtime.hooks;
    Object.assign(runtime.hooks, mockHooks);

    const element = runtime.document.createElement('div');
    element.id = 'callback-element';
    runtime.document.body.appendChild(element);

    const mpEvent = {
      type: 'tap',
      target: { dataset: {}, id: 'callback-element' },
      currentTarget: { dataset: {}, id: 'callback-element' },
      detail: {},
      [EVENT_CALLBACK_RESULT]: 'test-result',
    } as any;

    const result = eventHandler(mpEvent);

    expect(result).toBe('test-result');
    expect(mpEvent[EVENT_CALLBACK_RESULT]).toBeUndefined();

    Object.assign(runtime.hooks, originalHooks);
  });

  test('eventHandler with batched events and parent bound', () => {
    const batchedEvents: CallableFunction[] = [];
    const mockHooks = {
      call: vi.fn((name, ...args) => {
        if (name === 'batchedEventUpdates') {
          const fn = args[0];
          if (batchedEvents.length > 0) {
            batchedEvents.forEach((f) => f());
            batchedEvents.length = 0;
          }
          fn();
          return;
        }
        if (name === 'isBubbleEvents') return true;
        return true; // isParentBound returns true
      }),
      isExist: vi.fn((name) => name === 'batchedEventUpdates'),
    };

    const originalHooks = runtime.hooks;
    Object.assign(runtime.hooks, mockHooks);

    const element = runtime.document.createElement('div');
    element.id = 'parent-bound-element';
    runtime.document.body.appendChild(element);

    const mpEvent = {
      type: 'tap',
      target: { dataset: {}, id: 'parent-bound-element' },
      currentTarget: { dataset: {}, id: 'parent-bound-element' },
      detail: {},
    };

    eventHandler(mpEvent);

    expect(mockHooks.call).toHaveBeenCalledWith('isBubbleEvents', 'tap');

    Object.assign(runtime.hooks, originalHooks);
  });

  test('eventHandler without node element', () => {
    const mockHooks = {
      call: vi.fn(),
      isExist: vi.fn(() => false),
    };

    const originalHooks = runtime.hooks;
    Object.assign(runtime.hooks, mockHooks);

    // Don't create element in document
    const mpEvent = {
      type: 'tap',
      target: { dataset: {}, id: 'non-existent-element' },
      currentTarget: { dataset: {}, id: 'non-existent-element' },
      detail: {},
    };

    const result = eventHandler(mpEvent);

    // Should not call dispatch-related hooks when element not found
    expect(mockHooks.call).toHaveBeenCalledWith('modifyMpEventImpl', mpEvent);
    expect(result).toBeUndefined();

    Object.assign(runtime.hooks, originalHooks);
  });

  test('eventHandler flushes delegated child event when parent handles same bubble event', () => {
    vi.spyOn(runtime.hooks, 'isExist').mockImplementation((name) => name === 'batchedEventUpdates');
    vi.spyOn(runtime.hooks, 'call').mockImplementation((name, ...args) => {
      if (name === 'batchedEventUpdates') {
        args[0]();
      }
      if (name === 'isBubbleEvents') {
        return true;
      }
      if (name === 'getSpecialNodes') {
        return ['view', 'text', 'image'];
      }
      if (name === 'dispatchTaroEvent') {
        args[1].dispatchEvent(args[0]);
      }
    });

    const parent = document.createElement('view');
    const child = document.createElement('view');
    parent.id = 'delegated-parent';
    child.id = 'delegated-child';
    document.body.appendChild(parent);
    parent.appendChild(child);

    const parentSpy = vi.fn();
    const childSpy = vi.fn();
    parent.addEventListener('tap', parentSpy, null);
    child.addEventListener('tap', childSpy, null);

    expect(eventHandler(createMpEvent('tap', 'delegated-child'))).toBeUndefined();
    expect(childSpy).not.toHaveBeenCalled();

    eventHandler(createMpEvent('tap', 'delegated-parent'));

    expect(childSpy).toHaveBeenCalledTimes(1);
    expect(parentSpy).toHaveBeenCalledTimes(1);
  });

  test('eventHandler keeps delegated batches isolated by event type', () => {
    vi.spyOn(runtime.hooks, 'isExist').mockImplementation((name) => name === 'batchedEventUpdates');
    vi.spyOn(runtime.hooks, 'call').mockImplementation((name, ...args) => {
      if (name === 'batchedEventUpdates') {
        args[0]();
      }
      if (name === 'isBubbleEvents') {
        return true;
      }
      if (name === 'getSpecialNodes') {
        return ['view', 'text', 'image'];
      }
      if (name === 'dispatchTaroEvent') {
        args[1].dispatchEvent(args[0]);
      }
    });

    const parent = document.createElement('view');
    const child = document.createElement('view');
    parent.id = 'typed-parent';
    child.id = 'typed-child';
    document.body.appendChild(parent);
    parent.appendChild(child);

    const childTapSpy = vi.fn();
    const childTouchEndSpy = vi.fn();
    const parentTapSpy = vi.fn();
    const parentTouchEndSpy = vi.fn();
    parent.addEventListener('tap', parentTapSpy, null);
    parent.addEventListener('touchend', parentTouchEndSpy, null);
    child.addEventListener('tap', childTapSpy, null);
    child.addEventListener('touchend', childTouchEndSpy, null);

    eventHandler(createMpEvent('tap', 'typed-child'));
    eventHandler(createMpEvent('touchend', 'typed-child'));

    expect(childTapSpy).not.toHaveBeenCalled();
    expect(childTouchEndSpy).not.toHaveBeenCalled();

    eventHandler(createMpEvent('tap', 'typed-parent'));

    expect(childTapSpy).toHaveBeenCalledTimes(1);
    expect(childTouchEndSpy).not.toHaveBeenCalled();
    expect(parentTapSpy).toHaveBeenCalledTimes(1);
    expect(parentTouchEndSpy).not.toHaveBeenCalled();

    eventHandler(createMpEvent('touchend', 'typed-parent'));

    expect(childTouchEndSpy).toHaveBeenCalledTimes(1);
    expect(parentTouchEndSpy).toHaveBeenCalledTimes(1);
  });
});
