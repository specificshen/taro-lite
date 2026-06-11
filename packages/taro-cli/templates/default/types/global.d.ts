/// <reference types="@spcsn/taro" />

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    TARO_ENV: 'weapp';
    TARO_APP_ID: string;
  }
}
