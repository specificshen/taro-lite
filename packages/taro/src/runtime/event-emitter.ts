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
  static eventSplitter = ',';

  constructor(opts?: { callbacks?: EventCallbacks }) {
    this.callbacks = opts?.callbacks ?? {};
  }

  on(eventName: EventName, callback: (...args: unknown[]) => void, context?: unknown): this {
    let event: EventName | undefined, tail: Record<string, never>, _eventName: EventName[];
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
    while ((event = _eventName.shift())) {
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
    let event: EventName | undefined, calls: EventCallbacks | undefined, _events: EventName[];
    if (!(calls = this.callbacks)) {
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
    while ((event = _events.shift())) {
      let node: CallbackNode | undefined = calls[event] as unknown as CallbackNode | undefined;
      delete calls[event];
      if (!node || !(callback || context)) {
        continue;
      }
      const tail = (node.tail as CallbackNode | undefined) ?? (node.next as CallbackNode | undefined)?.tail ?? {};
      while ((node = node.next as CallbackNode | undefined) && node !== tail) {
        const cb = node.callback;
        const ctx = node.context;
        if ((callback && cb !== callback) || (context && ctx !== context)) {
          this.on(event, cb as (...args: unknown[]) => void, ctx);
        }
      }
    }
    return this;
  }

  trigger(events: EventName, ...args: unknown[]) {
    let event: EventName | undefined,
      node: CallbackNode | undefined,
      calls: EventCallbacks | undefined,
      _events: EventName[];
    if (!(calls = this.callbacks)) {
      return this;
    }
    if (typeof events === 'symbol') {
      _events = [events];
    } else {
      _events = events.split(Events.eventSplitter);
    }
    while ((event = _events.shift())) {
      if ((node = calls[event] as unknown as CallbackNode | undefined)) {
        const tail = (node.tail as CallbackNode | undefined) ?? (node.next as CallbackNode | undefined)?.tail ?? {};
        while ((node = node.next as CallbackNode | undefined) && node !== tail) {
          node.callback?.apply(node.context || this, args);
        }
      }
    }
    return this;
  }
}
