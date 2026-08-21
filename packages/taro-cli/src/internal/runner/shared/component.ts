import type { IComponentConfig } from '@spcsn/taro/types/compile/hooks';

/**
 * 默认打包进 base.wxml 的组件白名单。
 *
 * 包含两类组件：
 * 1. 运行时可能由 Taro 创建的通用内置组件（如 page-container、root-portal 等）。
 * 2. 业务中最常见的基础组件，避免空项目也需要二次配置。
 *
 * 其他组件会在构建时通过扫描 JSX 自动收集到 includes 中；如果使用了未覆盖的组件，
 * 也可以通过 modifyComponentConfig 手动补充。
 */
const DEFAULT_INCLUDED_COMPONENTS = [
  // 视图容器
  'view',
  'catch-view',
  'static-view',
  'pure-view',
  'click-view',
  'scroll-view',
  'swiper',
  'swiper-item',
  'page-container',
  'root-portal',
  // 基础内容
  'text',
  'static-text',
  'icon',
  'progress',
  'rich-text',
  'image',
  'static-image',
  // 表单组件
  'button',
  'form',
  'input',
  'textarea',
  'switch',
  'slider',
  'picker',
  'radio',
  'radio-group',
  'checkbox',
  'checkbox-group',
  'label',
];

export const componentConfig: IComponentConfig = {
  includes: new Set(DEFAULT_INCLUDED_COMPONENTS),
  exclude: new Set(),
  thirdPartyComponents: new Map(),
  includeAll: false,
};

export function resetComponentConfigIncludes() {
  componentConfig.includes = new Set(DEFAULT_INCLUDED_COMPONENTS);
}
