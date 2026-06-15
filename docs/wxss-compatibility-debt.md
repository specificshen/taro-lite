# 小程序兼容性技术债务

> 记录业务项目 `ali-your-space-miniapp` 在微信小程序上传及运行阶段遇到的兼容性问题。
> 自 taro-lite **v1.1.2** 起，以下问题已在底座工程中统一根治，业务项目可逐步移除临时兼容插件。

## 目录

- [WXSS 编译错误](#wxss-编译错误)
- [运行时：Swiper indicator-offset 非法值警告](#运行时swiper-indicator-offset-非法值警告)

## 状态速览

| 问题 | 状态 | 修复版本 |
|------|------|----------|
| `#RRGGBBAA` 8 位 hex 颜色 | ✅ 已修复 | v1.1.2 |
| `*` 通配符选择器 | ✅ 已兜底处理（推荐源码改用 `gap`） | v1.1.2 |
| CSS Modules hash 含 `-`/`--` | ✅ 已修复（默认改为 hex） | v1.1.2 |
| 微信工具二次压缩 `rgba()` | ✅ 已修复（模板默认 `minifyWXSS: false`） | v1.1.2 |
| Swiper `indicator-offset` 默认值 | ✅ 已修复 | v1.1.2 |

---

## WXSS 编译错误

### 背景

业务项目使用 `@spcsn/taro`（Vite + React + CSS Modules）构建微信小程序，并开启 Skyline 渲染引擎。
在微信开发者工具执行“上传”时，微信服务端会对产物 `.wxss` 进行编译校验，报出如下错误：

```
Error: 上传失败：网络请求错误， (async upload fail Error: wxss 编译错误，错误信息：
ErrorFileCount[2] ./common.wxss(1:51296): error at token `*`
./pages/order-detail/index.wxss(1:2043): error at token `:`
```

后续修复过程中，列号随产物内容变化而漂移，但根因始终集中在两类 WXSS 不支持的语法：

1. **`*` 通配符选择器**
2. **8 位十六进制颜色 `#RRGGBBAA`**

---

## 问题 1：`*` 通配符选择器

### 现象

产物 `.wxss` 中出现类似选择器：

```css
/* common.wxss */
.Qm4a>*{flex:1;width:100%}

/* pages/order-detail/index.wxss */
.BD74.sJa1.QsUl>*:last-child{margin-right:0}
```

微信 WXSS 编译器不支持 `*` 通配符，报错：

```
./common.wxss(1:51296): error at token `*`
./pages/order-detail/index.wxss(1:2464): error at token `:`
```

### 业务源码示例

错误来源通常是 CSS Modules 文件中书写了 `>` 子节点选择器，并搭配 `*`：

```css
/* src/components/shared/action-bar/index.module.css */
.content > * {
  flex: 1;
  width: 100%;
}

/* src/components/ui/space/index.module.css */
.space.wrap.horizontal > *:last-child {
  margin-right: 0;
}
```

### 业务侧临时修复

将 `*` 替换为具体标签，或移除无意义的冗余样式：

```css
/* action-bar：子元素均为 button */
.content > button,
.content > view {
  flex: 1;
  width: 100%;
}

/* space：gap 已能满足间距需求，直接删除 */
.space.wrap.horizontal {
  gap: 8px;
}
```

> **底座已内置处理**：v1.1.2 起 `taro:vite-wxss-compat` 插件会在 `generateBundle` 阶段自动将 `.class > *` 展开为常见小程序标签列表；其它含 `*` 的选择器会输出构建警告并移除。建议业务源码仍优先使用 `gap` 等现代布局属性，避免依赖兜底转换。

---

## 问题 2：8 位十六进制颜色 `#RRGGBBAA`

### 现象

Vite 8 默认使用 LightningCSS 处理并压缩 CSS，会把带透明度的 `rgba(R, G, B, A)` 转换为 `#RRGGBBAA`：

```css
/* 源码 */
color: rgba(17, 31, 44, 0.56);

/* Vite 产物 */
color: #111f2c8f;
```

微信 WXSS 编译器不支持 8 位 hex 颜色，报错：

```
./pages/order-detail/index.wxss(1:2043): error at token `:`
```

（列号会偏移到后面某个 `:`）

### 业务侧临时修复

1. **Vite 构建阶段后处理**：在 `generateBundle` 阶段把所有 `.wxss` 中的 `#RRGGBBAA` 转回 `rgba()`。

   ```ts
   // config/plugins/wxss-compat.ts
   const HEX8_REGEX = /#([0-9a-fA-F]{8})/g;

   function hex8ToRgba(hex: string): string {
     const value = hex.slice(1);
     const r = Number.parseInt(value.slice(0, 2), 16);
     const g = Number.parseInt(value.slice(2, 4), 16);
     const b = Number.parseInt(value.slice(4, 6), 16);
     const a = Number.parseInt(value.slice(6, 8), 16) / 255;
     const roundedA = Math.round(a * 100) / 100;
     return `rgba(${r},${g},${b},${roundedA})`;
   }
   ```

2. **关闭微信开发者工具的二次压缩**：`project.config.json` 中设置 `"minifyWXSS": false`，防止微信工具在上传时把 `rgba()` 再次压回 `#RRGGBBAA`。

> **底座已内置处理**：v1.1.2 起 `taro:vite-wxss-compat` 插件会自动转换 `#RRGGBBAA`，且脚手架/测试 fixture 的 `project.config.json` 默认 `minifyWXSS: false`。业务项目可移除 `config/plugins/wxss-compat.ts`。

---

## 问题 3：CSS Modules hash 中的 `-` 与 `--`

### 现象

当 `generateScopedName` 使用 base64 hash 时，hash 中可能出现 `-` 或 `--`：

```css
.index-module__alignBaseline___--DAz { ... }
.index-module__penaltyLabel___-tTKU { ... }
```

虽然 CSS 规范允许 `-` 出现在标识符中间，但微信 WXSS 编译器对 `--` 及紧跟 `-` 的 className 解析较为严格，存在潜在报错风险。

### 业务侧临时修复

将 CSS Modules hash 从 base64 改为纯十六进制，彻底避开 `-` 和 `--`：

```ts
// config/index.ts
mini: {
  postcss: {
    cssModules: {
      enable: true,
      config: {
        namingPattern: 'module',
        generateScopedName: '[name]__[local]___[hash:hex:8]',
      },
    },
  },
},
```

`[hash:hex:8]` 的冲突概率（16^8 ≈ 43 亿）高于原 `[hash:base64:5]`（64^5 ≈ 10.7 亿），且 className 仅含 `0-9a-f`，兼容性最好。

> **底座已内置处理**：v1.1.2 起底座默认 `generateScopedName` 已改为 `[hash:hex:8]`，脚手架模板同步调整。业务项目无需再显式配置。

---

## 底座工程中的根治实现

上述问题已在 taro-lite 底座工程中按以下方式实现（v1.1.2）：

### 1. 构建产物后处理：WXSS 合规化

`@spcsn/taro-mini-runner` 新增内置插件 `taro:vite-wxss-compat`，在 `taro:vite-style` 之后、`taro:vite-mini-emit` 之前的 `generateBundle` 阶段执行：

- 将 `#RRGGBBAA` 转回 `rgba()`
- 对 `.class > *` 直接子元素通配符自动展开为常见小程序标签列表
- 其它含 `*` 的选择器输出构建警告并移除对应规则

源码位于：

- `packages/taro-mini-runner/src/plugins/vite-plugin-wxss-compat.ts`
- `packages/taro-mini-runner/src/style-transforms/wxss-compat.ts`

### 2. CSS Modules 默认 hash 策略

默认 `generateScopedName` 已调整为 `[hash:hex:8]`，脚手架模板与测试 fixture 同步使用 `[name]__[local]___[hash:hex:8]`，彻底避免 `-` / `--`。

### 3. 构建期兜底 + 源码约束

- 产物阶段兜底转换 `#RRGGBBAA` 与 `*` 选择器
- 脚手架示例组件已移除所有 `> *` gap hack，改用 `gap` 属性

### 4. 文档与脚手架约束

- `project.config.json` 模板默认 `"minifyWXSS": false`，防止微信开发者工具上传时二次压缩生成 `#RRGGBBAA`
- `packages/taro-components/global.css` 已改造为小程序安全版本，移除 `*` 与 `html/body/a` 等 web 专属选择器
- 本文档保留历史记录，供业务项目排查参考

---

## 业务项目历史改动清单（v1.1.2 前）

底座已统一根治，新业务项目无需再手动修改：

| 文件 | 说明 |
|------|------|
| `src/components/shared/action-bar/index.module.css` | `.content > *` 改为 `.content > button, .content > view` |
| `src/components/ui/space/index.module.css` | 删除 `.space.wrap.horizontal > *:last-child` |
| `src/features/community-quick-actions/index.module.css` | 删除默认值 `letter-spacing: normal` |
| `config/plugins/wxss-compat.ts` | 新增 Vite 插件，兜底转换 `#RRGGBBAA` |
| `config/index.ts` | 注册 wxss-compat 插件；CSS modules hash 改为 `[hash:hex:8]` |
| `project.config.json` | `"minifyWXSS": false`，防止微信上传时二次压缩生成 `#RRGGBBAA` |

---

## 运行时：Swiper indicator-offset 非法值警告

### 现象

运行时控制台出现警告：

```
[Component] <swiper>: illegal value passed in for indicator-offset attribute, using [0, 0] instead
```

### 根因

底座 `base.wxml` 中 `<swiper>` 模板对 `indicator-offset` 的默认值为：

```html
indicator-offset="{{i.p13||[]}}"
```

当业务代码未显式传入 `indicatorOffset` 时，微信会收到 `[]`（空数组）。

但根据[微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html)，`indicator-offset` 的类型是 **长度为 2 的数组**，默认值为 **`[0, 0]`**。空数组 `[]` 不是合法值，因此微信回退到 `[0, 0]` 并打印警告。

这是底座组件/模板层面的默认值错误，业务项目“之前没有”是因为旧版本底座模板未包含该属性或默认值不同。

### 业务侧临时修复

在所有使用 `<Swiper>` 的地方显式传入合法默认值：

```tsx
// src/components/ui/swiper/index.tsx
<Swiper
  ...
  indicatorOffset={[0, 0]}
>

// src/features/tab-page-home/components/index-banner/index.tsx
<Swiper
  ...
  indicatorOffset={[0, 0]}
>
```

> **底座已内置处理**：v1.1.2 起 `packages/taro-cli/src/platform-weapp/components.ts` 中 Swiper 的 `indicator-offset` 默认值已改为 `'[0, 0]'`，生成的 `base.wxml` 输出 `indicator-offset="{{i.p13||[0, 0]}}"`。业务项目可移除显式默认值。

### 底座工程中的根治实现

1. **修正 base.wxml 模板默认值**

   `packages/taro-cli/src/platform-weapp/components.ts` 中 Swiper 配置已改为：

   ```ts
   'indicator-offset': '[0, 0]',
   ```

   生成的 `base.wxml` 现在输出：

   ```html
   indicator-offset="{{i.p13||[0, 0]}}"
   ```

2. **组件类型与默认值对齐**

   在 `@spcsn/taro-components` 的 `SwiperProps` 中，如果存在 `indicatorOffset` 的默认定义，确保其默认值为 `[0, 0]` 而不是 `[]`。

3. **构建期默认值检查**

   后续可考虑在底座生成 `base.wxml` 时，对小程序原生组件属性的默认值做校验，避免传入微信不认可的非法默认值（如空数组、空对象等）。

### 业务项目历史改动清单（补充）

| 文件 | 说明 |
|------|------|
| `src/components/ui/swiper/index.tsx` | `<Swiper>` 增加 `indicatorOffset={[0, 0]}` |
| `src/features/tab-page-home/components/index-banner/index.tsx` | `<Swiper>` 增加 `indicatorOffset={[0, 0]}` |