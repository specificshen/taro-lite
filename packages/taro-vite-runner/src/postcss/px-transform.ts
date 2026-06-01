// @ts-nocheck

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

let targetUnit;

const SPECIAL_PIXEL = ['Px', 'PX', 'pX'];
let unConvertTargetUnit;
let platform;

const pxRegex = (units = ['px']) =>
  new RegExp(`"[^"]+"|'[^']+'|url\\([^\\)]+\\)|(\\d*\\.?\\d+)(${units.join('|')})`, 'g');

const filterPropList = {
  exact: (list) => list.filter((item) => item.match(/^[^\*!]+$/)),
  contain: (list) => list.filter((item) => item.match(/^\*.+\*$/)).map((item) => item.substr(1, item.length - 2)),
  endWith: (list) => list.filter((item) => item.match(/^\*[^\*]+$/)).map((item) => item.substr(1)),
  startWith: (list) => list.filter((item) => item.match(/^[^\*!]+\*$/)).map((item) => item.substr(0, item.length - 1)),
  notExact: (list) => list.filter((item) => item.match(/^\![^\*].*$/)).map((item) => item.substr(1)),
  notContain: (list) => list.filter((item) => item.match(/^\!\*.+\*$/)).map((item) => item.substr(2, item.length - 3)),
  notEndWith: (list) => list.filter((item) => item.match(/^\!\*[^\*]+$/)).map((item) => item.substr(2)),
  notStartWith: (list) =>
    list.filter((item) => item.match(/^\![^\*]+\*$/)).map((item) => item.substr(1, item.length - 2)),
};

const postcssPxTransform = (options = {}) => {
  options = Object.assign({}, DEFAULT_WEAPP_OPTIONS, options);
  const exclude = options.exclude;
  const transUnits = ['px'];
  const baseFontSize = options.baseFontSize || (options.minRootSize >= 1 ? options.minRootSize : 20);
  const designWidth = (input) =>
    typeof options.designWidth === 'function' ? options.designWidth(input) : options.designWidth;

  platform = options.platform;
  switch (options.platform) {
    case 'h5': {
      targetUnit = options.targetUnit ?? 'rem';

      switch (targetUnit) {
        case 'vw':
        case 'vmin':
          options.rootValue = (input) => {
            return designWidth(input) / 100;
          };
          break;
        case 'px':
          options.rootValue = (input) => (1 / options.deviceRatio[designWidth(input)]) * 2;
          break;
        default:
          options.rootValue = (input) => {
            return (baseFontSize / options.deviceRatio[designWidth(input)]) * 2;
          };
          break;
      }

      transUnits.push('rpx');
      break;
    }
    case 'rn': {
      options.rootValue = (input) => (1 / options.deviceRatio[designWidth(input)]) * 2;
      targetUnit = 'px';
      break;
    }
    case 'quickapp': {
      options.rootValue = () => 1;
      targetUnit = 'px';
      break;
    }
    case 'harmony': {
      options.rootValue = (input) => 1 / options.deviceRatio[designWidth(input)];
      targetUnit = 'px';
      unConvertTargetUnit = 'ch';
      transUnits.push(...SPECIAL_PIXEL);
      break;
    }
    default: {
      targetUnit = options.targetUnit ?? 'rpx';

      if (targetUnit === 'rem') {
        options.rootValue = (input) => (baseFontSize / options.deviceRatio[designWidth(input)]) * 2;
      } else if (targetUnit === 'px') {
        options.rootValue = (input) => (1 / options.deviceRatio[designWidth(input)]) * 2;
      } else {
        options.rootValue = (input) => 1 / options.deviceRatio[designWidth(input)];
      }
    }
  }

  convertLegacyOptions(options);

  const opts = Object.assign({}, defaults, options);
  const onePxTransform = typeof options.onePxTransform === 'undefined' ? true : options.onePxTransform;
  const pxRgx = pxRegex(transUnits);

  const satisfyPropList = createPropListMatcher(opts.propList);

  return {
    postcssPlugin: 'postcss-pxtransform',
    prepare(result) {
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
        Comment(comment) {
          if (comment.text === 'postcss-pxtransform disable') {
            skip = true;
            return;
          }

          if (!opts.methods.includes('platform')) return;

          if (options.platform === 'rn') {
            if (comment.text === 'postcss-pxtransform rn eject enable') {
              let next = comment.next();
              while (next) {
                if (next.text === 'postcss-pxtransform rn eject disable') {
                  break;
                }
                const temp = next.next();
                next.remove();
                next = temp;
              }
            }
          }

          const wordList = comment.text.split(' ');
          if (wordList.indexOf('#ifdef') > -1) {
            if (wordList.indexOf(options.platform) === -1) {
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
            if (wordList.indexOf(options.platform) > -1) {
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
        Declaration(decl) {
          if (skip) return;
          if (!opts.methods.includes('size')) return;

          if (decl[processed]) return;

          decl[processed] = true;

          if (!/px/i.test(decl.value)) return;

          if (!satisfyPropList(decl.prop)) return;

          const isBlacklisted = blacklistedSelector(opts.selectorBlackList, decl.parent.selector);
          if (isBlacklisted && platform !== 'harmony') return;
          let value;
          if (isBlacklisted) {
            if (platform === 'harmony') {
              value = decl.value.replace(pxRgx, (match, pixelValue) =>
                pixelValue ? pixelValue + unConvertTargetUnit : match,
              );
            } else {
              return;
            }
          } else {
            value = decl.value.replace(pxRgx, pxReplace);
          }
          if (declarationExists(decl.parent, decl.prop, value)) return;
          if (opts.replace) {
            decl.value = value;
          } else {
            decl.cloneAfter({ value: value });
          }
        },
        AtRule: {
          media: (rule) => {
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

function convertLegacyOptions(options) {
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
      options[legacyOptions[key]] = options[key];
      delete options[key];
    }
  });
}

function createPxReplace(rootValue, unitPrecision, minPixelValue, onePxTransform) {
  const specialPxRgx = pxRegex(SPECIAL_PIXEL);
  return function (input) {
    return function (match, pixelValue) {
      if (!pixelValue) return match;

      if (platform === 'harmony' && specialPxRgx.test(match)) {
        return pixelValue + unConvertTargetUnit;
      }

      if (!onePxTransform && parseInt(pixelValue, 10) === 1) {
        if (platform === 'harmony') {
          return pixelValue + unConvertTargetUnit;
        }
        return match;
      }
      const pixels = parseFloat(pixelValue);
      if (pixels < minPixelValue) {
        if (platform === 'harmony') {
          return pixelValue + unConvertTargetUnit;
        }
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

function toFixed(number, precision) {
  const multiplier = Math.pow(10, precision + 1);
  const wholeNumber = Math.floor(number * multiplier);
  return (Math.round(wholeNumber / 10) * 10) / multiplier;
}

function declarationExists(decls, prop, value) {
  return decls.some(function (decl) {
    return decl.prop === prop && decl.value === value;
  });
}

function blacklistedSelector(blacklist, selector) {
  if (typeof selector !== 'string') return;
  return blacklist.some(function (regex) {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;
    return selector.match(regex);
  });
}

function createPropListMatcher(propList) {
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
  return function (prop) {
    if (matchAll) return true;
    return (
      (hasWild ||
        lists.exact.indexOf(prop) > -1 ||
        lists.contain.some(function (match) {
          return prop.indexOf(match) > -1;
        }) ||
        lists.startWith.some(function (match) {
          return prop.indexOf(match) === 0;
        }) ||
        lists.endWith.some(function (match) {
          return prop.indexOf(match) === prop.length - match.length;
        })) &&
      !(
        lists.notExact.indexOf(prop) > -1 ||
        lists.notContain.some(function (match) {
          return prop.indexOf(match) > -1;
        }) ||
        lists.notStartWith.some(function (match) {
          return prop.indexOf(match) === 0;
        }) ||
        lists.notEndWith.some(function (match) {
          return prop.indexOf(match) === prop.length - match.length;
        })
      )
    );
  };
}

postcssPxTransform.postcss = true;

export default postcssPxTransform;
