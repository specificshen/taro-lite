#!/usr/bin/env bun

/** 逐包执行 tsc --noEmit，最后检查根 tsconfig（scripts 等）。 */
import { $ } from 'bun';

const projects = [
  'packages/taro-components',
  'packages/taro',
  'packages/taro-cli',
  'packages/taro-components/tests',
  'packages/taro/tests',
  'packages/taro-cli/tests',
  'tsconfig.json',
];

for (const project of projects) {
  await $`bun x tsc --noEmit -p ${project}`;
}
