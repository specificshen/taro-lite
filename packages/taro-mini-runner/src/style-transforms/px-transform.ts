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

const pxRegex = (units: any[] = ['px']) =>
  new RegExp(`"[^"]+"|'[^']+'|url\\([^\\)]+\\)|(\\d*\\.?\\d+)(${units.join('|')})`, 'g');

const filterPropList = {
  exact: (list: any[]) => list.filter((item: any) => item.match(/^[^\*!]+$/)),
  contain: (list: any[]) =>
    list.filter((item: any) => item.match(/^\*.+\*$/)).map((item: any) => item.substr(1, item.length - 2)),
  endWith: (list: any[]) => list.filter((item: any) => item.match(/^\*[^\*]+$/)).map((item: any) => item.substr(1)),
  startWith: (list: any[]) =>
    list.filter((item: any) => item.match(/^[^\*!]+\*$/)).map((item: any) => item.substr(0, item.length - 1)),
  notExact: (list: any[]) => list.filter((item: any) => item.match(/^\![^\*].*$/)).map((item: any) => item.substr(1)),
  notContain: (list: any[]) =>
    list.filter((item: any) => item.match(/^\!\*.+\*$/)).map((item: any) => item.substr(2, item.length - 3)),
  notEndWith: (list: any[]) =>
    list.filter((item: any) => item.match(/^\!\*[^\*]+$/)).map((item: any) => item.substr(2)),
  notStartWith: (list: any[]) =>
    list.filter((item: any) => item.match(/^\![^\*]+\*$/)).map((item: any) => item.substr(1, item.length - 2)),
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

  const satisfyPropList = createPropListMatcher(opts.propList);

  return {
    postcssPlugin: 'postcss-pxtransform',
    prepare(result: any) {
      const pxReplace = createPxReplace(
        opts.rootValue,
        opts.unitPrecision,
        opts.minPixelValue,
        onePxTransform,
      )(result.root.source.input);

      let skip = false;

      if (exclude && exclude?.(result.opts.from)) {
        return null;
      }

      return {
        Comment(comment: any) {
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
                if (next.type === 'comment' && next.text.trim() === '#endif') {
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
                if (next.type === 'comment' && next.text.trim() === '#endif') {
                  break;
                }
                const temp = next.next();
                next.remove();
                next = temp;
              }
            }
          }
        },
        Declaration(decl: any) {
          if (skip) return;
          if (!opts.methods.includes('size')) return;

          if (decl[processed]) return;

          decl[processed] = true;

          if (!/px/i.test(decl.value)) return;

          if (!satisfyPropList(decl.prop)) return;

          const isBlacklisted = blacklistedSelector(opts.selectorBlackList, decl.parent.selector);
          if (isBlacklisted) return;
          const value = decl.value.replace(pxRgx, pxReplace);
          if (declarationExists(decl.parent, decl.prop, value)) return;
          if (opts.replace) {
            decl.value = value;
          } else {
            decl.cloneAfter({ value: value });
          }
        },
        AtRule: {
          media: (rule: any) => {
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

function convertLegacyOptions(options: any) {
  if (typeof options !== 'object') return;
  if (
    ((typeof options.prop_white_list !== 'undefined' && options.prop_white_list.length === 0) ||
      (typeof options.propWhiteList !== 'undefined' && options.propWhiteList.length === 0)) &&
    typeof options.propList === 'undefined'
  ) {
    options.propList = ['*'];
    delete options.prop_white_list;
    delete options.propWhiteList;
  }
  Object.keys(legacyOptions).forEach(function (key) {
    if (options.hasOwnProperty(key)) {
      options[(legacyOptions as Record<string, any>)[key]] = options[key];
      delete options[key];
    }
  });
}

function createPxReplace(rootValue: any, unitPrecision: any, minPixelValue: any, onePxTransform: any) {
  return function (input: any) {
    return function (match: any, pixelValue: any) {
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

function toFixed(number: any, precision: any) {
  const multiplier = Math.pow(10, precision + 1);
  const wholeNumber = Math.floor(number * multiplier);
  return (Math.round(wholeNumber / 10) * 10) / multiplier;
}

function declarationExists(decls: any, prop: any, value: any) {
  return decls.some(function (decl: any) {
    return decl.prop === prop && decl.value === value;
  });
}

function blacklistedSelector(blacklist: any, selector: any) {
  if (typeof selector !== 'string') return;
  return blacklist.some(function (regex: any) {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;
    return selector.match(regex);
  });
}

function createPropListMatcher(propList: any) {
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
  return function (prop: any) {
    if (matchAll) return true;
    return (
      (hasWild ||
        lists.exact.indexOf(prop) > -1 ||
        lists.contain.some(function (match: any) {
          return prop.indexOf(match) > -1;
        }) ||
        lists.startWith.some(function (match: any) {
          return prop.indexOf(match) === 0;
        }) ||
        lists.endWith.some(function (match: any) {
          return prop.indexOf(match) === prop.length - match.length;
        })) &&
      !(
        lists.notExact.indexOf(prop) > -1 ||
        lists.notContain.some(function (match: any) {
          return prop.indexOf(match) > -1;
        }) ||
        lists.notStartWith.some(function (match: any) {
          return prop.indexOf(match) === 0;
        }) ||
        lists.notEndWith.some(function (match: any) {
          return prop.indexOf(match) === prop.length - match.length;
        })
      )
    );
  };
}

postcssPxTransform.postcss = true;

export default postcssPxTransform;
