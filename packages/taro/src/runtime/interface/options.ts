interface SelectorQuery {
  select(selector: string): {
    boundingClientRect(callback: (res: unknown) => void): {
      exec(): void;
    };
  };
}

export interface MiniGlobal {
  createSelectorQuery(): SelectorQuery;
}

export interface Options {
  prerender: boolean;
  debug: boolean;
  miniGlobal?: MiniGlobal;
}
