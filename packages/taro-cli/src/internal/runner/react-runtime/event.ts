import { flushSync } from './reconciler';

let shouldFlushAfterEvent = false;

// 标记当前事件结束后需要执行一次 flushSync，
// 用于 input/change 等需要立即落值的场景。
export function markShouldFlushAfterEvent() {
  shouldFlushAfterEvent = true;
}

export function finishEventHandler() {
  if (shouldFlushAfterEvent) {
    flushSync();
    shouldFlushAfterEvent = false;
  }
}
