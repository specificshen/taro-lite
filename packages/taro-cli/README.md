# `@spcsn/taro-cli`

`@spcsn/taro-cli` 是 Taro Lite 的命令行入口，负责项目初始化与微信小程序构建。

## 包定位

- 业务侧公开工具包，可全局安装，也可作为项目 devDependency 使用。
- service、runner、helper、shared 等内部能力已源码级内联到本包，不再作为独立包发布。
- 业务项目只应安装 `@spcsn/taro`、`@spcsn/taro-components`、`@spcsn/taro-cli` 三个入口包。

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
| `build` | 构建微信小程序项目 |

## 支持范围

当前只维护 React 19 开发微信小程序（Skyline / glass-easel）链路，不支持 H5、React Native、Harmony、Vue、Webpack 等上游历史路径。
