export function throttle(
  fn: (...args: any[]) => void,
  threshold = 250,
  scope?: any,
): (this: any, ...args: any[]) => void {
  let lastTime = 0;
  let deferTimer: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
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

export function debounce(fn: (...args: any[]) => void, ms = 250, scope?: any): (this: any, ...args: any[]) => void {
  let timer: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: any[]) {
    const context = scope || this;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, ms);
  };
}
