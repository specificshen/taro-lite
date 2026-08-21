/**
 * WXSS 兼容性后处理。
 *
 * 微信小程序上传编译器对 WXSS 语法限制较多，而 Vite 8 默认使用 LightningCSS
 * 压缩 CSS，会把 `rgba(R,G,B,A)` 压成 `#RRGGBBAA`，业务源码中的 `*` 通配符
 * 也会原样进入产物。本模块在构建完成后对 `.wxss` 产物做兜底转换。
 */

import postcss from 'postcss';

const HEX8_REGEX = /#([0-9a-fA-F]{8})\b/g;
const HEX4_REGEX = /#([0-9a-fA-F]{4})\b/g;

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

/**
 * 4 位十六进制颜色（如 `#fffc`）转 `rgba()`。
 * 每位数字重复一次即等价于 8 位 hex。
 */
export function hex4ToRgba(hex: string): string {
  const value = hex.slice(1);
  const r = Number.parseInt(value[0] + value[0], 16);
  const g = Number.parseInt(value[1] + value[1], 16);
  const b = Number.parseInt(value[2] + value[2], 16);
  const a = Number.parseInt(value[3] + value[3], 16) / 255;
  const roundedA = Math.round(a * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${roundedA})`;
}

export interface WxssTransformResult {
  css: string;
  warnings: string[];
}

/**
 * 对 WXSS 文本做兼容性转换：
 * 1. `#RRGGBBAA` / `#RGBA` -> `rgba()`
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
      if (isUnsupportedDeclaration(child)) {
        child.remove();
        return;
      }

      if (isInsetShorthand(child)) {
        expandInsetShorthand(child);
        return;
      }

      child.value = child.value
        .replace(HEX8_REGEX, (match) => hex8ToRgba(match))
        .replace(HEX4_REGEX, (match) => hex4ToRgba(match));
    }
  });
}

/**
 * WXSS 编译器不支持的声明（默认值可直接移除）。
 */
function isUnsupportedDeclaration(decl: postcss.Declaration): boolean {
  return decl.prop === 'letter-spacing' && decl.value.trim() === 'normal';
}

/**
 * Skyline 不支持 `inset` 简写，兜底展开为 top / right / bottom / left。
 */
function isInsetShorthand(decl: postcss.Declaration): boolean {
  return decl.prop === 'inset';
}

function expandInsetShorthand(decl: postcss.Declaration): void {
  const values = decl.value.trim().split(/\s+/);
  const [top, right = top, bottom = top, left = right] = values;
  decl.replaceWith(
    { prop: 'top', value: top, important: decl.important },
    { prop: 'right', value: right, important: decl.important },
    { prop: 'bottom', value: bottom, important: decl.important },
    { prop: 'left', value: left, important: decl.important },
  );
}

function transformRule(rule: postcss.Rule, warnings: string[]): void {
  const hasExplicitUniversal = rule.selector.includes('*');
  const hasImplicitUniversal = isDirectChildImplicitUniversalOnly(rule.selector);

  if (!hasExplicitUniversal && !hasImplicitUniversal) return;

  if (isDirectChildUniversalOnly(rule.selector, hasImplicitUniversal)) {
    const expanded = expandDirectChildUniversal(rule.selector, hasImplicitUniversal);
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
 * 当 allowImplicit 为 true 时，也接受 `.foo > :pseudo`（隐式 *）。
 */
function isDirectChildUniversalOnly(selector: string, allowImplicit = false): boolean {
  const parts = splitSelector(selector);
  return parts.every((part) => {
    if (/^.*>\s*\*(:[a-zA-Z-]+(?:\([^)]*\))?)?$/.test(part)) return true;
    return allowImplicit && /^.*>\s*(:[a-zA-Z-]+(?:\([^)]*\))?)?$/.test(part);
  });
}

/**
 * 判断 selector 是否包含隐式通配符的直接子元素选择器，例如 `.foo > :last-child`。
 */
function isDirectChildImplicitUniversalOnly(selector: string): boolean {
  const parts = splitSelector(selector);
  return parts.some((part) => /^.*>\s*(:[a-zA-Z-]+(?:\([^)]*\))?)?$/.test(part));
}

function expandDirectChildUniversal(selector: string, implicit = false): string | undefined {
  const parts = splitSelector(selector);
  const expanded: string[] = [];

  for (const part of parts) {
    const match = part.match(
      implicit ? /^(.*>\s*)(:[a-zA-Z-]+(?:\([^)]*\))?)?$/ : /^(.*>\s*)(\*)(:[a-zA-Z-]+(?:\([^)]*\))?)?$/,
    );
    if (!match) return;

    const prefix = match[1];
    const suffix = implicit ? (match[2] ?? '') : (match[3] ?? '');
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
