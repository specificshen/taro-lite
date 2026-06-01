import { Rule } from 'postcss';

const htmlTags = [
  'html',
  'body',
  'a',
  'audio',
  'button',
  'canvas',
  'form',
  'iframe',
  'img',
  'input',
  'label',
  'progress',
  'select',
  'slot',
  'textarea',
  'video',
  'abbr',
  'area',
  'b',
  'bdi',
  'big',
  'br',
  'cite',
  'code',
  'data',
  'datalist',
  'del',
  'dfn',
  'em',
  'i',
  'ins',
  'kbd',
  'map',
  'mark',
  'meter',
  'output',
  'picture',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'td',
  'template',
  'th',
  'time',
  'tt',
  'u',
  'var',
  'wbr',
  'address',
  'article',
  'aside',
  'blockquote',
  'caption',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'legend',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'tbody',
  'tfoot',
  'thead',
  'tr',
  'ul',
  'svg',
];

const miniAppTags = [
  'cover-image',
  'cover-view',
  'match-media',
  'movable-area',
  'movable-view',
  'page-container',
  'scroll-view',
  'share-element',
  'swiper',
  'swiper-item',
  'view',
  'icon',
  'progress',
  'rich-text',
  'text',
  'button',
  'checkbox',
  'checkbox-group',
  'editor',
  'form',
  'input',
  'keyboard-accessory',
  'label',
  'picker',
  'picker-view',
  'picker-view-column',
  'radio',
  'radio-group',
  'slider',
  'switch',
  'textarea',
  'functional-page-navigator',
  'navigator',
  'audio',
  'camera',
  'image',
  'live-player',
  'live-pusher',
  'video',
  'voip-room',
  'map',
  'canvas',
  'web-view',
  'ad',
  'ad-custom',
  'official-account',
  'open-data',
  'navigation-bar',
  'page-meta',
];

const tagsToRegExp = (tags: string[] = []) =>
  new RegExp(`(^| |\\+|,|~|>|\\n)(${tags.join('|')})\\b(?=$| |\\.|\\+|,|~|:|\\[)`, 'g');

interface Options {
  platform?: string;
  removeCursorStyle?: boolean;
}

const postcssHtmlTransform = (options: Options = {}) => {
  let selectorFilter: RegExp | undefined;
  let walkRules: ((rule: Rule) => void) | undefined;

  switch (options.platform) {
    case 'h5': {
      selectorFilter = tagsToRegExp(miniAppTags);
      walkRules = (rule: Rule) => {
        rule.selector = rule.selector.replace(selectorFilter!, '$1taro-$2-core');
      };
      break;
    }
    case 'rn':
    case 'quickapp': {
      break;
    }
    default: {
      const selector = tagsToRegExp(htmlTags);
      walkRules = (rule: Rule) => {
        if (/(^| )\*(?![=/*])/.test(rule.selector)) {
          rule.remove();
          return;
        }
        rule.selector = rule.selector.replace(selector, '$1.h5-$2');
      };
    }
  }

  return {
    postcssPlugin: 'postcss-html-transform',
    Rule(rule: Rule) {
      if (typeof walkRules === 'function') {
        walkRules(rule);
      }
    },
    Declaration(decl) {
      if (options?.removeCursorStyle && decl.prop === 'cursor') {
        decl.remove();
      }
    },
  };
};

postcssHtmlTransform.postcss = true;

export default postcssHtmlTransform;
