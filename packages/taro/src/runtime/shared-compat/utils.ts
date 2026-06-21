import { internalComponents } from './components';

export { internalComponents } from './components';

export function toDashed(s: string) {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function toCamelCase(s: string) {
  let camel = '';
  let nextCap = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '-') {
      camel += nextCap ? s[i].toUpperCase() : s[i];
      nextCap = false;
    } else {
      nextCap = true;
    }
  }
  return camel;
}

export const toKebabCase = function (string: string) {
  return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const objectHasOwnProperty = Object.prototype.hasOwnProperty;

export const hasOwn = (val: Record<string, unknown>, key: string) => objectHasOwnProperty.call(val, key);

let _uniqueId = 1;
const _loadTime = new Date().getTime().toString();

export function getUniqueKey() {
  return _loadTime + _uniqueId++;
}

export function mergeInternalComponents(components: Record<string, any>) {
  Object.keys(components).forEach((name) => {
    if (name in internalComponents) {
      Object.assign(internalComponents[name], components[name]);
    } else {
      internalComponents[name] = components[name];
    }
  });
  return internalComponents;
}

export function getComponentsAlias(origin: typeof internalComponents) {
  const mapping: Record<string, Record<string, string>> = {};
  const viewAttrs = origin.View;
  const extraList: Record<string, Record<string, string>> = {
    '#text': {},
    StaticView: viewAttrs,
    StaticImage: origin.Image,
    StaticText: origin.Text,
    PureView: viewAttrs,
    CatchView: viewAttrs,
    ClickView: viewAttrs,
  };
  origin = { ...origin, ...extraList };
  Object.keys(origin)
    .sort((a, b) => {
      const reg = /^(Static|Pure|Catch|Click)*(View|Image|Text)$/;
      const isACommonly = reg.test(a);
      const isBCommonly = reg.test(b);
      if (isACommonly && isBCommonly) {
        return a > b ? 1 : -1;
      } else if (isACommonly) {
        return -1;
      } else if (isBCommonly) {
        return 1;
      } else {
        return a >= b ? 1 : -1;
      }
    })
    .forEach((key, num) => {
      const obj: Record<string, string> = {
        _num: String(num),
      };
      Object.keys(origin[key])
        .filter((attr) => !/^bind/.test(attr) && !['focus', 'blur', '$duplicateFromComponent'].includes(attr))
        .sort()
        .forEach((attr, index) => {
          obj[toCamelCase(attr)] = 'p' + index;
        });
      mapping[toDashed(key)] = obj;
    });

  return mapping;
}

export function nonsupport(api: string) {
  return function () {
    console.warn(`小程序暂不支持 ${api}`);
  };
}

export function setUniqueKeyToRoute(key: string, obj: Record<string, unknown>) {
  const routerParamsPrivateKey = '__key_';
  const useDataCacheApis = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab'];

  if (useDataCacheApis.indexOf(key) > -1) {
    const url = String(obj.url || '');
    obj.url = url;
    const hasMark = url.indexOf('?') > -1;
    const cacheKey = getUniqueKey();
    obj.url += (hasMark ? '&' : '?') + `${routerParamsPrivateKey}=${cacheKey}`;
  }
}

export function indent(str: string, size: number): string {
  return str
    .split('\n')
    .map((line, index) => {
      const indent = index === 0 ? '' : Array(size).fill(' ').join('');
      return indent + line;
    })
    .join('\n');
}
