import type { ChalkInstance } from 'chalk';
import { chalk } from './terminal';

type GlobalWithPlatforms = typeof global & {
  PLATFORMS?: Record<string, string>;
};

const globalWithPlatforms = global as GlobalWithPlatforms;

globalWithPlatforms.PLATFORMS = globalWithPlatforms.PLATFORMS || {};
export const PLATFORMS = globalWithPlatforms.PLATFORMS;

export enum processTypeEnum {
  START = 'start',
  CREATE = 'create',
  COMPILE = 'compile',
  CONVERT = 'convert',
  COPY = 'copy',
  GENERATE = 'generate',
  MODIFY = 'modify',
  ERROR = 'error',
  WARNING = 'warning',
  UNLINK = 'unlink',
  REFERENCE = 'reference',
  REMIND = 'remind',
}

export interface IProcessTypeMap {
  [key: string]: {
    name: string;
    color: string | ChalkInstance;
  };
}

export const processTypeMap: IProcessTypeMap = {
  [processTypeEnum.CREATE]: {
    name: '创建',
    color: 'cyan',
  },
  [processTypeEnum.COMPILE]: {
    name: '编译',
    color: 'green',
  },
  [processTypeEnum.CONVERT]: {
    name: '转换',
    color: chalk.rgb(255, 136, 0),
  },
  [processTypeEnum.COPY]: {
    name: '拷贝',
    color: 'magenta',
  },
  [processTypeEnum.GENERATE]: {
    name: '生成',
    color: 'blue',
  },
  [processTypeEnum.MODIFY]: {
    name: '修改',
    color: 'yellow',
  },
  [processTypeEnum.ERROR]: {
    name: '错误',
    color: 'red',
  },
  [processTypeEnum.WARNING]: {
    name: '警告',
    color: 'yellowBright',
  },
  [processTypeEnum.UNLINK]: {
    name: '删除',
    color: 'magenta',
  },
  [processTypeEnum.START]: {
    name: '启动',
    color: 'green',
  },
  [processTypeEnum.REFERENCE]: {
    name: '引用',
    color: 'blue',
  },
  [processTypeEnum.REMIND]: {
    name: '提示',
    color: 'green',
  },
};

export const CSS_EXT: string[] = ['.css', '.wxss'];
export const JS_EXT: string[] = ['.js', '.jsx'];
export const TS_EXT: string[] = ['.ts', '.tsx'];
export const SCRIPT_EXT: string[] = JS_EXT.concat(TS_EXT);

export const REG_MEDIA = /\.(mp4|webm|ogg|mp3|m4a|wav|flac|aac)(\?.*)?$/;
export const REG_IMAGE = /\.(png|jpe?g|gif|bpm|svg|webp)(\?.*)?$/;
export const REG_FONT = /\.(woff2?|eot|ttf|otf)(\?.*)?$/;
export const REG_JSON = /\.json(\?.*)?$/;

export const REG_TARO_SCOPED_PACKAGE = /@spcsn[\\/]taro(?:[\\/]|-[a-z-]+)/;
export const REG_CSS_IMPORT = /@import (["'])(.+?)\1;/g;

export const NODE_MODULES = 'node_modules';
export const REG_NODE_MODULES = /node_modules/;
export const REG_NODE_MODULES_DIR = /[\\/]node_modules[\\/]/gi;

export const PROJECT_CONFIG = 'config/index';

export const taroJsMiniComponentsPath = '@spcsn/taro-components';

export const TARO_GLOBAL_CONFIG_DIR = '.taro-global-config';
export const TARO_GLOBAL_CONFIG_FILE = 'index.json';

export const OUTPUT_DIR = 'dist';
export const SOURCE_DIR = 'src';
export const ENTRY = 'app';

export const defaultMainFields = ['browser', 'module', 'jsnext:main', 'main'];
