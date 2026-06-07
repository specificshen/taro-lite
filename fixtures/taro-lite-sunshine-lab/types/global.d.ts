/// <reference types="@spcsn/taro" />

declare module '*.css';

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    TARO_ENV: 'weapp';
    TARO_MINIFY?: 'true';
  }
}
