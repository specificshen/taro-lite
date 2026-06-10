import path from 'node:path';
import { fs } from '@spcsn/taro-helper';
import { TYPES_DIR } from './constants';

type WordTransform = (word: string, index: number) => string;

interface CaseOptions {
  transform?: WordTransform;
}

function splitCaseWords(value: string): string[] {
  return value
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}

export function camelCaseEnhance(word = '', index: number) {
  word = word.toLowerCase();
  if (index !== 0) {
    word = `${word[0].toUpperCase()}${word.slice(1)}`;
  }
  return word;
}

export function camelCase(value: string, options: CaseOptions = {}): string {
  const transform = options.transform || camelCaseEnhance;
  return splitCaseWords(value)
    .map((word, index) => transform(word, index))
    .join('');
}

export function paramCase(value: string): string {
  return splitCaseWords(value)
    .map((word) => word.toLowerCase())
    .join('-');
}

export function pascalCase(value: string): string {
  const camelCasedValue = camelCase(value);
  return camelCasedValue ? `${camelCasedValue[0].toUpperCase()}${camelCasedValue.slice(1)}` : '';
}

export function getTypesList(type = ''): string[] {
  if (type) {
    return fs.readdirSync(path.join('node_modules', 'miniapp-types/dist/types', type));
  }
  return fs.readdirSync(TYPES_DIR);
}

export function getTypeFilePath(name: string): string {
  return path.join(TYPES_DIR, `${name}.d.ts`);
}
