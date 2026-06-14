import { Rule, Declaration } from 'postcss';

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

const tagsToRegExp = (tags: string[] = []) =>
  new RegExp(`(^| |\\+|,|~|>|\\n)(${tags.join('|')})\\b(?=$| |\\.|\\+|,|~|:|\\[)`, 'g');

interface Options {
  platform?: string;
  removeCursorStyle?: boolean;
}

const postcssHtmlTransform = (options: Options = {}) => {
  const selector = tagsToRegExp(htmlTags);
  const walkRules = (rule: Rule) => {
    if (/(^| )\*(?![=/*])/.test(rule.selector)) {
      rule.remove();
      return;
    }
    rule.selector = rule.selector.replace(selector, '$1.h5-$2');
  };

  return {
    postcssPlugin: 'postcss-html-transform',
    Rule(rule: Rule) {
      if (typeof walkRules === 'function') {
        walkRules(rule);
      }
    },
    Declaration(decl: Declaration) {
      if (options?.removeCursorStyle && decl.prop === 'cursor') {
        decl.remove();
      }
    },
  };
};

postcssHtmlTransform.postcss = true;

export default postcssHtmlTransform;
