import * as fs from 'node:fs';
import * as path from 'node:path';

interface ConfigWithEnv {
  env?: Record<string, unknown>;
}

// 支持 --env-prefix=TARO_APP_,aa 类型参数
export const formatPrefix = (prefixs: string | string[] = ['TARO_APP_']): string[] => {
  const prefixsArr: string[] = (Array.isArray(prefixs) ? prefixs : prefixs.split(','))
    .map((prefix) => prefix.trim())
    .filter((prefix) => !!prefix);
  return prefixsArr;
};

/** 以下为 dotenv / dotenv-expand 的自实现等价逻辑，避免额外引入 npm 依赖 */

// 等价于 dotenv 的 parse 行匹配：支持 KEY=VALUE、export 前缀、单/双/反引号包裹值、# 注释与空行
const DOTENV_LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

// 等价于 dotenv 的 parse：把 .env 文件内容解析为键值映射
const parseDotenv = (src: string | Buffer): Record<string, string> => {
  const obj: Record<string, string> = {};

  // 统一换行符为 \n
  const lines = src.toString().replace(/\r\n?/gm, '\n');

  let match = DOTENV_LINE.exec(lines);
  while (match !== null) {
    const key = match[1];

    // 无值时默认为空字符串
    let value = match[2] || '';

    // 去除首尾空白
    value = value.trim();

    // 记录是否被双引号包裹
    const maybeQuote = value[0];

    // 去除成对包裹的引号
    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2');

    // 双引号包裹的值展开换行转义
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\r/g, '\r');
    }

    obj[key] = value;
    match = DOTENV_LINE.exec(lines);
  }

  return obj;
};

// 处理转义：`\$` => `$`
const resolveEscapeSequences = (value: string): string => value.replace(/\\\$/g, '$');

// 展开单个值中的 $VAR 与 ${VAR} 引用，等价于 dotenv-expand 的取值逻辑
const expandEnvValue = (value: string, runningParsed: Record<string, string>): string => {
  // 引用来源为同批次已展开变量 + process.env，后者优先级更高
  const env: Record<string, string | undefined> = { ...runningParsed, ...process.env };

  const templateReg = /(?<!\\)\${([^{}]+)}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g;

  let result = value;
  const seen = new Set<string>(); // 自引用检查

  let match = templateReg.exec(result);
  while (match !== null) {
    seen.add(result);

    const [template, bracedExpression, unbracedExpression] = match;
    const expression = bracedExpression || unbracedExpression;

    // 支持 `:+`、`+`、`:-`、`-` 操作符
    const opMatch = expression.match(/(:\+|\+|:-|-)/);
    const splitter = opMatch ? opMatch[0] : null;

    const parts = splitter ? expression.split(splitter) : [expression];

    let defaultValue: string;
    let replaceValue: string | null | undefined;

    const key = parts.shift() || '';

    if (splitter === ':+' || splitter === '+') {
      defaultValue = env[key] ? parts.join(splitter) : '';
      replaceValue = null;
    } else {
      defaultValue = parts.join(splitter || '');
      replaceValue = env[key];
    }

    if (replaceValue) {
      // 自引用时使用默认值兜底，避免死循环
      if (seen.has(replaceValue)) {
        result = result.replace(template, defaultValue);
      } else {
        result = result.replace(template, replaceValue);
      }
    } else {
      result = result.replace(template, defaultValue);
    }

    // 展开结果与同批次变量值一致时停止
    if (result === runningParsed[key]) {
      break;
    }

    // 替换后从头重新匹配
    templateReg.lastIndex = 0;
    match = templateReg.exec(result);
  }

  return result;
};

// 等价于 dotenv-expand 的 expand：就地展开 parsed，并把结果写入 process.env（已有键以 process.env 为准）
const expandDotenv = (parsed: Record<string, string>): Record<string, string> => {
  // 渐进式展开：先处理的键可被后续键引用
  const runningParsed: Record<string, string> = {};

  for (const key in parsed) {
    let value = parsed[key];

    const existingValue = process.env[key];
    // 短路场景：process.env 已存在该键且值不同，以 process.env 为准
    if (existingValue && existingValue !== value) {
      value = existingValue;
    } else {
      value = expandEnvValue(value, runningParsed);
    }

    parsed[key] = resolveEscapeSequences(value);
    runningParsed[key] = resolveEscapeSequences(value);
  }

  for (const key in parsed) {
    process.env[key] = parsed[key];
  }

  return parsed;
};

export const dotenvParse = (
  root: string,
  prefixs: string | string[] = ['TARO_APP_'],
  mode?: string,
): Record<string, string> => {
  const prefixsArr: string[] = formatPrefix(prefixs);

  const envFiles = new Set([/** default file */ `.env`, /** local file */ `.env.local`]);

  if (mode) {
    envFiles.add(/** mode file */ `.env.${mode}`);
    envFiles.add(/** mode local file */ `.env.${mode}.local`);
  }

  let parsedEnvFiles: Record<string, string> = {};
  const load = (envPath: string) => {
    if (!fs.existsSync(envPath)) return;
    const env = parseDotenv(fs.readFileSync(envPath));
    parsedEnvFiles = {
      ...parsedEnvFiles,
      ...env,
    };
  };

  envFiles.forEach((envPath) => {
    load(path.resolve(root, envPath));
  });

  const parsed: Record<string, string> = {};
  Object.entries(parsedEnvFiles).forEach(([key, value]) => {
    if (prefixsArr.some((prefix) => key.startsWith(prefix)) || ['TARO_APP_ID'].includes(key)) {
      parsed[key] = value;
    }
  });
  expandDotenv(parsed);
  return parsed;
};

// 扩展 env
export const patchEnv = (config: ConfigWithEnv, expandEnv: Record<string, string>) => {
  const expandEnvStringify: Record<string, string> = {};
  for (const key in expandEnv) {
    expandEnvStringify[key] = JSON.stringify(expandEnv[key]);
  }
  return {
    ...config.env,
    ...expandEnvStringify,
  };
};
