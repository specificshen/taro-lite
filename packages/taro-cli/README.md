# `@spcsn/taro-cli`

`@spcsn/taro` 命令行工具，提供项目初始化、构建、检测、信息查询等功能。

## 安装

```shell
pnpm add -g @spcsn/taro-cli
```

## 使用

```shell
taro <command> [options]
```

## 命令

| 命令 | 说明 |
| --- | --- |
| `init <name>` | 创建新项目 |
| `build` | 构建项目 |
| `config` | 查看/设置全局配置 |
| `doctor` | 检测项目配置与依赖是否有问题 |
| `info` | 打印当前环境信息 |
| `inspect` | 检查 Vite 构建配置 |
| `update` | 更新 `@spcsn` 相关依赖到最新版本 |

## 支持的平台

- 微信小程序（weapp）
- Skyline / glass-easel

> 本工具仅支持 React 19 + Vite 构建链，不支持 H5、React Native、Harmony、Vue、Webpack 等。
