export function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  threshold = 250,
  scope?: unknown,
): (this: unknown, ...args: TArgs) => void {
  let lastTime = 0;
  let deferTimer: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: TArgs) {
    const context = scope || this;
    const now = Date.now();
    if (now - lastTime > threshold) {
      fn.apply(this, args);
      lastTime = now;
    } else {
      clearTimeout(deferTimer);
      deferTimer = setTimeout(() => {
        lastTime = now;
        fn.apply(context, args);
      }, threshold);
    }
  };
}

export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  ms = 250,
  scope?: unknown,
): (this: unknown, ...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout>;

  return function (this: unknown, ...args: TArgs) {
    const context = scope || this;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, ms);
  };
}
