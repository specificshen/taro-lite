export interface EventListenerOptions {
  capture?: boolean;
}

export interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
  sideEffect?: boolean;
}

export interface EventHandler<T = any, R = void> {
  (...args: T[]): R;
  _stop?: boolean;
  oldHandler?: EventHandler;
}
