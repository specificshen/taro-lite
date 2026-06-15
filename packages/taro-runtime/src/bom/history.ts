import { isNumber, isString } from '@spcsn/taro-shared';
import { CONTEXT_ACTIONS } from '../constants';
import { Events } from '../emitter/emitter';
import { RuntimeCache } from '../utils/cache';
import type { TaroLocation } from './location';
import type { TaroWindow } from './window';

export interface HistoryState {
  state: unknown;
  title: string;
  url: string;
}

type Options = {
  window: TaroWindow;
};
type HistoryContext = {
  location: TaroLocation;
  stack: HistoryState[];
  cur: number;
};
const cache = new RuntimeCache<HistoryContext>('history');

class TaroHistory extends Events {
  /* private property */
  #location: TaroLocation;
  #stack: HistoryState[] = [];
  #cur = 0;

  #window: TaroWindow;

  constructor(location: TaroLocation, options: Options) {
    super();

    this.#window = options.window;
    this.#location = location;

    this.#location.on(
      '__record_history__',
      (...args: unknown[]) => {
        const href = args[0] as string;
        this.#cur++;
        this.#stack = this.#stack.slice(0, this.#cur);
        this.#stack.push({
          state: null,
          title: '',
          url: href,
        });
      },
      null,
    );

    this.#location.on(
      '__reset_history__',
      (...args: unknown[]) => {
        this.#reset(args[0] as string);
      },
      null,
    );

    // 切换上下文行为

    this.on(
      CONTEXT_ACTIONS.INIT,
      () => {
        this.#reset();
      },
      null,
    );

    this.on(
      CONTEXT_ACTIONS.RESTORE,
      (...args: unknown[]) => {
        cache.set(args[0] as string, {
          location: this.#location,
          stack: this.#stack.slice(),
          cur: this.#cur,
        });
      },
      null,
    );

    this.on(
      CONTEXT_ACTIONS.RECOVER,
      (...args: unknown[]) => {
        const pageId = args[0] as string;
        if (cache.has(pageId)) {
          const ctx = cache.get(pageId)!;
          this.#location = ctx.location;
          this.#stack = ctx.stack;
          this.#cur = ctx.cur;
        }
      },
      null,
    );

    this.on(
      CONTEXT_ACTIONS.DESTROY,
      (...args: unknown[]) => {
        cache.delete(args[0] as string);
      },
      null,
    );

    this.#reset();
  }

  #reset(href = '') {
    this.#stack = [
      {
        state: null,
        title: '',
        url: href || this.#location.href,
      },
    ];
    this.#cur = 0;
  }

  /* public property */
  get length() {
    return this.#stack.length;
  }

  get state() {
    return this.#stack[this.#cur].state;
  }

  /* public method */
  go(delta: number) {
    if (!isNumber(delta) || Number.isNaN(delta)) return;

    let targetIdx = this.#cur + delta;
    targetIdx = Math.min(Math.max(targetIdx, 0), this.length - 1);

    this.#cur = targetIdx;

    this.#location.trigger('__set_href_without_history__', this.#stack[this.#cur].url);
    this.#window.trigger('popstate', this.#stack[this.#cur]);
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  pushState(state: unknown, title: string, url: string) {
    if (!url || !isString(url)) return;
    this.#stack = this.#stack.slice(0, this.#cur + 1);
    this.#stack.push({
      state,
      title,
      url,
    });
    this.#cur = this.length - 1;

    this.#location.trigger('__set_href_without_history__', url);
  }

  replaceState(state: unknown, title: string, url: string) {
    if (!url || !isString(url)) return;
    this.#stack[this.#cur] = {
      state,
      title,
      url,
    };

    this.#location.trigger('__set_href_without_history__', url);
  }

  // For debug
  get cache() {
    return cache;
  }
}

export type { TaroHistory };
export const History: typeof TaroHistory = TaroHistory;
