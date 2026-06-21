type EventName = string | symbol;
export type EventCallbacks = Record<EventName, Record<'next' | 'tail', unknown>>;

interface CallbackNode {
  next?: CallbackNode | Record<string, never>;
  tail?: CallbackNode | Record<string, never>;
  context?: unknown;
  callback?: (...args: unknown[]) => void;
}

export class Events {
  protected callbacks?: EventCallbacks;
  static eventSplitter = ','; // Note: Harmony ACE API 8 开发板不支持使用正则 split 字符串 /\s+/

  constructor(opts?: { callbacks?: EventCallbacks }) {
    this.callbacks = opts?.callbacks ?? {};
  }

  on(eventName: EventName, callback: (...args: unknown[]) => void, context?: unknown): this {
    let tail: Record<string, never>, _eventName: EventName[];
    if (!callback) {
      return this;
    }
    if (typeof eventName === 'symbol') {
      _eventName = [eventName];
    } else {
      _eventName = eventName.split(Events.eventSplitter);
    }
    this.callbacks ||= {};
    const calls = this.callbacks;
    for (const event of _eventName) {
      const list = calls[event] as unknown as CallbackNode | undefined;
      const node: CallbackNode = list ? (list.tail as CallbackNode) : {};
      node.next = tail = {};
      node.context = context;
      node.callback = callback;
      calls[event] = {
        tail,
        next: list ? list.next : node,
      } as unknown as Record<'next' | 'tail', unknown>;
    }
    return this;
  }

  once(events: EventName, callback: (...r: unknown[]) => void, context?: unknown): this {
    const wrapper = (...args: unknown[]) => {
      callback.apply(this, args);
      this.off(events, wrapper, context);
    };

    this.on(events, wrapper, context);

    return this;
  }

  off(events?: EventName, callback?: (...args: unknown[]) => void, context?: unknown) {
    let node: CallbackNode | undefined, _events: EventName[];
    const calls = this.callbacks;
    if (!calls) {
      return this;
    }
    if (!(events || callback || context)) {
      delete this.callbacks;
      return this;
    }
    if (typeof events === 'symbol') {
      _events = [events];
    } else {
      _events = events ? events.split(Events.eventSplitter) : Object.keys(calls);
    }
    for (const event of _events) {
      node = calls[event] as unknown as CallbackNode | undefined;
      delete calls[event];
      if (!node || !(callback || context)) {
        continue;
      }
      const tail = (node.tail as CallbackNode | undefined) ?? (node.next as CallbackNode | undefined)?.tail ?? {};
      let currentNode = node.next as CallbackNode | undefined;
      while (currentNode && currentNode !== tail) {
        const cb = currentNode.callback;
        const ctx = currentNode.context;
        if ((callback && cb !== callback) || (context && ctx !== context)) {
          this.on(event, cb as (...args: unknown[]) => void, ctx);
        }
        currentNode = currentNode.next as CallbackNode | undefined;
      }
    }
    return this;
  }

  trigger(events: EventName, ...args: unknown[]) {
    let node: CallbackNode | undefined, _events: EventName[];
    const calls = this.callbacks;
    if (!calls) {
      return this;
    }
    if (typeof events === 'symbol') {
      _events = [events];
    } else {
      _events = events.split(Events.eventSplitter);
    }
    for (const event of _events) {
      node = calls[event] as unknown as CallbackNode | undefined;
      if (node) {
        const tail = (node.tail as CallbackNode | undefined) ?? (node.next as CallbackNode | undefined)?.tail ?? {};
        let currentNode = node.next as CallbackNode | undefined;
        while (currentNode && currentNode !== tail) {
          currentNode.callback?.apply(currentNode.context || this, args);
          currentNode = currentNode.next as CallbackNode | undefined;
        }
      }
    }
    return this;
  }
}
