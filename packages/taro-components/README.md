# `@spcsn/taro-components`

`@spcsn/taro-components` 是业务侧使用的小程序组件入口，提供 React 组件、组件类型声明和全局样式。

## 包定位

- 业务侧公开依赖，应由小程序应用显式安装。
- 运行时组件入口为 `dist/index.js`，类型入口为 `types/index.d.ts`。
- 仅面向 React + Vite + 微信小程序构建链。

## 导出内容

- `.`: 组件运行时入口。
- `./types/*`: 组件类型声明。
- `./global.css`: 组件全局样式。

## 支持范围

H5、React Native、Vue、Solid 以及非微信小程序平台不属于本包维护目标。组件行为应优先贴合微信小程序和 Skyline / glass-easel 输出。
