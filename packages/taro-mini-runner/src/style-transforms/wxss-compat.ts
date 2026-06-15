/**
 * WXSS 兼容性后处理。
 *
 * 微信小程序上传编译器对 WXSS 语法限制较多，而 Vite 8 默认使用 LightningCSS
 * 压缩 CSS，会把 `rgba(R,G,B,A)` 压成 `#RRGGBBAA`，业务源码中的 `*` 通配符
 * 也会原样进入产物。本模块在构建完成后对 `.wxss` 产物做兜底转换。
 */

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
 * 2. `.class > *` 直接子元素通配符 -> 展开为常见小程序标签
 * 3. 其它含 `*` 的选择器记录警告并移除对应规则
 *
 * 注意：本实现假设输入是由 Vite/LightningCSS 处理后的扁平 CSS，
 * 不处理源码层级复杂的嵌套/LESS/SCSS。
 */
export function transformWxss(css: string): WxssTransformResult {
  const warnings: string[] = [];
  const processed = processCss(css, warnings);
  const cssWithRgba = processed.replace(HEX8_REGEX, (match) => hex8ToRgba(match));
  return { css: cssWithRgba, warnings };
}

function processCss(css: string, warnings: string[]): string {
  let result = '';
  let i = 0;
  let selectorStart = 0;

  while (i < css.length) {
    if (css[i] === '{') {
      const selector = css.slice(selectorStart, i).trim();
      const bodyStart = i + 1;
      let braceDepth = 1;
      let j = i + 1;
      while (j < css.length && braceDepth > 0) {
        if (css[j] === '{') braceDepth++;
        else if (css[j] === '}') braceDepth--;
        j++;
      }
      const body = css.slice(bodyStart, j - 1);

      if (selector.startsWith('@')) {
        const processedBody = processCss(body, warnings);
        result += `${selector}{${processedBody}}`;
      } else {
        result += processRule(selector, body, warnings);
      }

      i = j;
      selectorStart = j;
      continue;
    }
    i++;
  }

  result += css.slice(selectorStart);
  return result;
}

function processRule(selector: string, body: string, warnings: string[]): string {
  if (!selector.includes('*')) {
    return `${selector}{${body}}`;
  }

  if (isDirectChildUniversalOnly(selector)) {
    const expanded = expandDirectChildUniversal(selector);
    return expanded ? `${expanded}{${body}}` : '';
  }

  warnings.push(`WXSS does not support universal selector "*": ${selector}`);
  return '';
}

/**
 * 判断 selector 的每个逗号分隔部分都是 `.foo > *[:pseudo]` 形式。
 */
function isDirectChildUniversalOnly(selector: string): boolean {
  const parts = splitSelector(selector);
  return parts.every((part) => /^.*>\s*\*(:[a-zA-Z-]+(?:\([^)]*\))?)?$/.test(part));
}

function expandDirectChildUniversal(selector: string): string {
  const parts = splitSelector(selector);
  const expanded: string[] = [];

  for (const part of parts) {
    const match = part.match(/^(.*>\s*)(\*)(:[a-zA-Z-]+(?:\([^)]*\))?)?$/);
    if (!match) return '';

    const prefix = match[1];
    const suffix = match[3] ?? '';
    // 如果前缀里还有其它 `*`，说明是更复杂的选择器，交给 warning 分支处理
    if (prefix.includes('*')) return '';

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
