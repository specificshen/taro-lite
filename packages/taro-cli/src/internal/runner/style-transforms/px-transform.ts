import type postcss from 'postcss';

type DesignWidthOption = number | ((input: string) => number);

type RootValueOption = number | ((input: string, match?: string, pixelValue?: string) => number);

interface PxTransformOptions {
  baseFontSize?: number;
  designWidth?: DesignWidthOption;
  deviceRatio?: Record<number, number>;
  exclude?: (filePath?: string) => boolean;
  mediaQuery?: boolean;
  methods?: string[];
  minPixelValue?: number;
  minRootSize?: number;
  onePxTransform?: boolean;
  platform?: string;
  propList?: string[];
  propWhiteList?: string[];
  prop_white_list?: string[];
  replace?: boolean;
  rootValue?: RootValueOption;
  root_value?: RootValueOption;
  selectorBlackList?: Array<string | RegExp>;
  targetUnit?: string;
  unitPrecision?: number;
  unit_precision?: number;
  selector_black_list?: Array<string | RegExp>;
  media_query?: boolean;
}

interface ResolvedPxTransformOptions extends PxTransformOptions {
  designWidth: DesignWidthOption;
  deviceRatio: Record<number, number>;
  platform: string;
}

const defaults = {
  methods: ['platform', 'size'],
  rootValue: 16,
  unitPrecision: 5,
  selectorBlackList: [],
  propList: ['*'],
  replace: true,
  mediaQuery: false,
  minPixelValue: 0,
};

const legacyOptions = {
  root_value: 'rootValue',
  unit_precision: 'unitPrecision',
  selector_black_list: 'selectorBlackList',
  prop_white_list: 'propList',
  media_query: 'mediaQuery',
  propWhiteList: 'propList',
};

const deviceRatio = {
  375: 2,
  640: 2.34 / 2,
  750: 1,
  828: 1.81 / 2,
};

const DEFAULT_WEAPP_OPTIONS = {
  platform: 'weapp',
  designWidth: 750,
  deviceRatio,
};

const processed = Symbol('processed');

let targetUnit: string;

const pxRegex = (units: string[] = ['px']) =>
  new RegExp(`"[^"]+"|'[^']+'|url\\([^\\)]+\\)|(\\d*\\.?\\d+)(${units.join('|')})`, 'g');

const filterPropList: Record<string, (list: string[]) => string[]> = {
  exact: (list: string[]) => list.filter((item: string) => item.match(/^[^\*!]+$/)),
  contain: (list: string[]) =>
    list.filter((item: string) => item.match(/^\*.+\*$/)).map((item: string) => item.substr(1, item.length - 2)),
  endWith: (list: string[]) =>
    list.filter((item: string) => item.match(/^\*[^\*]+$/)).map((item: string) => item.substr(1)),
  startWith: (list: string[]) =>
    list.filter((item: string) => item.match(/^[^\*!]+\*$/)).map((item: string) => item.substr(0, item.length - 1)),
  notExact: (list: string[]) =>
    list.filter((item: string) => item.match(/^\![^\*].*$/)).map((item: string) => item.substr(1)),
  notContain: (list: string[]) =>
    list.filter((item: string) => item.match(/^\!\*.+\*$/)).map((item: string) => item.substr(2, item.length - 3)),
  notEndWith: (list: string[]) =>
    list.filter((item: string) => item.match(/^\!\*[^\*]+$/)).map((item: string) => item.substr(2)),
  notStartWith: (list: string[]) =>
    list.filter((item: string) => item.match(/^\![^\*]+\*$/)).map((item: string) => item.substr(1, item.length - 2)),
};

const postcssPxTransform = (options: PxTransformOptions = {}) => {
  const resolvedOptions: ResolvedPxTransformOptions = Object.assign({}, DEFAULT_WEAPP_OPTIONS, options);
  const exclude = resolvedOptions.exclude;
  const transUnits = ['px'];
  const minRootSize = resolvedOptions.minRootSize ?? 0;
  const baseFontSize = resolvedOptions.baseFontSize || (minRootSize >= 1 ? minRootSize : 20);
  const designWidth = (input: string) =>
    typeof resolvedOptions.designWidth === 'function'
      ? resolvedOptions.designWidth(input)
      : resolvedOptions.designWidth;

  targetUnit = resolvedOptions.targetUnit ?? 'rpx';

  if (targetUnit === 'rem') {
    resolvedOptions.rootValue = (input) => (baseFontSize / resolvedOptions.deviceRatio[designWidth(input)]) * 2;
  } else if (targetUnit === 'px') {
    resolvedOptions.rootValue = (input) => (1 / resolvedOptions.deviceRatio[designWidth(input)]) * 2;
  } else {
    resolvedOptions.rootValue = (input) => 1 / resolvedOptions.deviceRatio[designWidth(input)];
  }

  convertLegacyOptions(resolvedOptions);

  const opts = Object.assign({}, defaults, resolvedOptions);
  const onePxTransform = typeof resolvedOptions.onePxTransform === 'undefined' ? true : resolvedOptions.onePxTransform;
  const pxRgx = pxRegex(transUnits);

  const satisfyPropList = createPropListMatcher(opts.propList as string[]);

  type ProcessedDecl = postcss.Declaration & Record<typeof processed, boolean>;

  return {
    postcssPlugin: 'postcss-pxtransform',
    prepare(result: postcss.Result) {
      const pxReplace = createPxReplace(
        opts.rootValue as unknown as (input: postcss.Input, match: string, pixelValue: string) => number,
        opts.unitPrecision as number,
        opts.minPixelValue as number,
        onePxTransform,
      )(result.root.source!.input);

      let skip = false;

      if (exclude && exclude?.(result.opts.from)) {
        return null;
      }

      return {
        Comment(comment: postcss.Comment) {
          if (comment.text === 'postcss-pxtransform disable') {
            skip = true;
            return;
          }

          if (!opts.methods.includes('platform')) return;

          const wordList = comment.text.split(' ');
          if (wordList.indexOf('#ifdef') > -1) {
            if (wordList.indexOf(resolvedOptions.platform) === -1) {
              let next = comment.next();
              while (next) {
                if (next.type === 'comment' && (next as postcss.Comment).text.trim() === '#endif') {
                  break;
                }
                const temp = next.next();
                next.remove();
                next = temp;
              }
            }
          }

          if (wordList.indexOf('#ifndef') > -1) {
            if (wordList.indexOf(resolvedOptions.platform) > -1) {
              let next = comment.next();
              while (next) {
                if (next.type === 'comment' && (next as postcss.Comment).text.trim() === '#endif') {
                  break;
                }
                const temp = next.next();
                next.remove();
                next = temp;
              }
            }
          }
        },
        Declaration(decl: postcss.Declaration) {
          if (skip) return;
          if (!opts.methods.includes('size')) return;

          if ((decl as ProcessedDecl)[processed]) return;

          (decl as ProcessedDecl)[processed] = true;

          if (!/px/i.test(decl.value)) return;

          if (!satisfyPropList(decl.prop)) return;

          const isBlacklisted = blacklistedSelector(
            opts.selectorBlackList as Array<string | RegExp>,
            (decl.parent as postcss.Rule).selector,
          );
          if (isBlacklisted) return;
          const value = decl.value.replace(pxRgx, pxReplace);
          if (declarationExists(decl.parent as postcss.Container, decl.prop, value)) return;
          if (opts.replace) {
            decl.value = value;
          } else {
            decl.cloneAfter({ value: value });
          }
        },
        AtRule: {
          media: (rule: postcss.AtRule) => {
            if (opts.mediaQuery) {
              if (skip) return;
              if (!opts.methods.includes('size')) return;

              if (!/px/i.test(rule.params)) return;
              rule.params = rule.params.replace(pxRgx, pxReplace);
            }
          },
        },
      };
    },
  };
};

function convertLegacyOptions(options: PxTransformOptions) {
  if (typeof options !== 'object') return;
  if (
    ((typeof options.prop_white_list !== 'undefined' && options.prop_white_list.length === 0) ||
      (typeof options.propWhiteList !== 'undefined' && options.propWhiteList.length === 0)) &&
    typeof options.propList === 'undefined'
  ) {
    (options as Record<string, unknown>).propList = ['*'];
    delete options.prop_white_list;
    delete options.propWhiteList;
  }
  Object.keys(legacyOptions).forEach(function (key) {
    if (Object.hasOwn(options, key)) {
      (options as Record<string, unknown>)[(legacyOptions as Record<string, string>)[key]] = (
        options as Record<string, unknown>
      )[key];
      delete (options as Record<string, unknown>)[key];
    }
  });
}

function createPxReplace(
  rootValue: (input: postcss.Input, match: string, pixelValue: string) => number,
  unitPrecision: number,
  minPixelValue: number,
  onePxTransform: boolean,
) {
  return function (input: postcss.Input) {
    return function (match: string, pixelValue: string) {
      if (!pixelValue) return match;

      if (!onePxTransform && parseInt(pixelValue, 10) === 1) {
        return match;
      }
      const pixels = parseFloat(pixelValue);
      if (pixels < minPixelValue) {
        return match;
      }

      let value = pixels / rootValue(input, match, pixelValue);
      if (unitPrecision >= 0 && unitPrecision <= 100) {
        value = toFixed(value, unitPrecision);
      }
      return value + targetUnit;
    };
  };
}

function toFixed(number: number, precision: number) {
  const multiplier = Math.pow(10, precision + 1);
  const wholeNumber = Math.floor(number * multiplier);
  return (Math.round(wholeNumber / 10) * 10) / multiplier;
}

function declarationExists(decls: postcss.Container, prop: string, value: string) {
  return decls.some(function (decl) {
    return (decl as postcss.Declaration).prop === prop && (decl as postcss.Declaration).value === value;
  });
}

function blacklistedSelector(blacklist: Array<string | RegExp>, selector: string) {
  if (typeof selector !== 'string') return;
  return blacklist.some(function (regex: string | RegExp) {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;
    return selector.match(regex) !== null;
  });
}

function createPropListMatcher(propList: string[]) {
  const hasWild = propList.indexOf('*') > -1;
  const matchAll = hasWild && propList.length === 1;
  const lists = {
    exact: filterPropList.exact(propList),
    contain: filterPropList.contain(propList),
    startWith: filterPropList.startWith(propList),
    endWith: filterPropList.endWith(propList),
    notExact: filterPropList.notExact(propList),
    notContain: filterPropList.notContain(propList),
    notStartWith: filterPropList.notStartWith(propList),
    notEndWith: filterPropList.notEndWith(propList),
  };
  return function (prop: string) {
    if (matchAll) return true;
    return (
      (hasWild ||
        lists.exact.indexOf(prop) > -1 ||
        lists.contain.some(function (match: string) {
          return prop.indexOf(match) > -1;
        }) ||
        lists.startWith.some(function (match: string) {
          return prop.indexOf(match) === 0;
        }) ||
        lists.endWith.some(function (match: string) {
          return prop.indexOf(match) === prop.length - match.length;
        })) &&
      !(
        lists.notExact.indexOf(prop) > -1 ||
        lists.notContain.some(function (match: string) {
          return prop.indexOf(match) > -1;
        }) ||
        lists.notStartWith.some(function (match: string) {
          return prop.indexOf(match) === 0;
        }) ||
        lists.notEndWith.some(function (match: string) {
          return prop.indexOf(match) === prop.length - match.length;
        })
      )
    );
  };
}

postcssPxTransform.postcss = true;

export default postcssPxTransform;
