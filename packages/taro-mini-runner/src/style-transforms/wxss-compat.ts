/**
 * WXSS 兼容性后处理。
 *
 * 微信小程序上传编译器对 WXSS 语法限制较多，而 Vite 8 默认使用 LightningCSS
 * 压缩 CSS，会把 `rgba(R,G,B,A)` 压成 `#RRGGBBAA`，业务源码中的 `*` 通配符
 * 也会原样进入产物。本模块在构建完成后对 `.wxss` 产物做兜底转换。
 */

import postcss from 'postcss';

const HEX8_REGEX = /#([0-9a-fA-F]{8})\b/g;

/**
 * 常见小程序原生标签，用于替换 `.class > *` 这类直接子元素通配符。
 * 保持标签列表与业务场景高频使用的元素一致即可，覆盖大多数 flex gap 布局。
 */
const UNIVERSAL_TAGS = [
  'view',
  'text',
  'image',
  'button',
  'input',
  'textarea',
  'scroll-view',
  'swiper',
  'swiper-item',
  'cover-view',
  'cover-image',
  'navigator',
  'video',
  'canvas',
  'map',
];

/**
 * 8 位十六进制颜色（如 `#111f2c8f`）转 `rgba()`。
 */
export function hex8ToRgba(hex: string): string {
  const value = hex.slice(1);
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const a = Number.parseInt(value.slice(6, 8), 16) / 255;
  const roundedA = Math.round(a * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${roundedA})`;
}

export interface WxssTransformResult {
  css: string;
  warnings: string[];
}

/**
 * 对 WXSS 文本做兼容性转换：
 * 1. `#RRGGBBAA` -> `rgba()`
 * 2. `.class > *` 直接子元素通配符 -> 展开为常见小程序标签（并提示业务源码优先使用 `gap`）
 * 3. 其它含 `*` 的选择器记录警告并移除对应规则
 *
 * 使用 PostCSS 解析，避免手写 brace 扫描在遇到字符串、注释、嵌套 @规则时出错。
 */
export function transformWxss(css: string): WxssTransformResult {
  const warnings: string[] = [];

  try {
    const root = postcss.parse(css);
    transformNode(root, warnings);
    return { css: root.toString(), warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(`WXSS compat post-processing failed, output left unchanged: ${message}`);
    return { css, warnings };
  }
}

function transformNode(node: postcss.Container, warnings: string[]): void {
  node.walk((child) => {
    if (child.type === 'rule') {
      transformRule(child, warnings);
    } else if (child.type === 'decl') {
      child.value = child.value.replace(HEX8_REGEX, (match) => hex8ToRgba(match));
    }
  });
}

function transformRule(rule: postcss.Rule, warnings: string[]): void {
  if (!rule.selector.includes('*')) return;

  if (isDirectChildUniversalOnly(rule.selector)) {
    const expanded = expandDirectChildUniversal(rule.selector);
    if (expanded) {
      warnings.push(
        `WXSS does not support universal selector "*"; expanding "${rule.selector}" to specific tags. Consider using "gap" in source CSS.`,
      );
      rule.selector = expanded;
      return;
    }
  }

  warnings.push(`WXSS does not support universal selector "*": ${rule.selector}`);
  rule.remove();
}

/**
 * 判断 selector 的每个逗号分隔部分都是 `.foo > *[:pseudo]` 形式。
 */
function isDirectChildUniversalOnly(selector: string): boolean {
  const parts = splitSelector(selector);
  return parts.every((part) => /^.*>\s*\*(:[a-zA-Z-]+(?:\([^)]*\))?)?$/.test(part));
}

function expandDirectChildUniversal(selector: string): string | undefined {
  const parts = splitSelector(selector);
  const expanded: string[] = [];

  for (const part of parts) {
    const match = part.match(/^(.*>\s*)(\*)(:[a-zA-Z-]+(?:\([^)]*\))?)?$/);
    if (!match) return;

    const prefix = match[1];
    const suffix = match[3] ?? '';
    // 如果前缀里还有其它 `*`，说明是更复杂的选择器，不处理
    if (prefix.includes('*')) return;

    for (const tag of UNIVERSAL_TAGS) {
      expanded.push(`${prefix}${tag}${suffix}`);
    }
  }

  return expanded.join(',');
}

function splitSelector(selector: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (const char of selector) {
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;

    if (char === ',' && parenDepth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}
