# `@spcsn/taro-cli`

`@spcsn/taro-cli` 是 Taro Lite 的命令行入口，负责项目初始化、构建、配置检查和运行环境信息输出。

## 包定位

- 业务侧公开工具包，可全局安装，也可作为项目 devDependency 使用。
- 内部编排 `@spcsn/taro-service`、`@spcsn/taro-mini-runner`、微信小程序平台能力和 native binding。
- 业务项目不应直接依赖 CLI 背后的 service、runner、helper 等内部包。

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
| `config` | 查看或设置全局配置 |
| `doctor` | 检测项目配置与依赖是否有问题 |
| `info` | 打印当前环境信息 |
| `inspect` | 检查 Vite 构建配置 |
| `update` | 更新 `@spcsn` 相关依赖到最新版本 |

## 支持范围

当前只维护 React 19 + Vite + 微信小程序（Skyline / glass-easel）链路，不支持 H5、React Native、Harmony、Vue、Webpack 等上游历史路径。
