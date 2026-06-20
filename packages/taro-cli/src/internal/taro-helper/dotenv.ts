import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'dotenv';
import { expand } from 'dotenv-expand';

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
    const env = parse(fs.readFileSync(envPath));
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
  expand({ parsed });
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
