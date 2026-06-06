#!/usr/bin/env bun

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type BindingPackage = {
  name: string;
  path: string;
  nodeFile: string;
  minSize: number;
};

type PackageJson = {
  main?: string;
};

const bindings: BindingPackage[] = [
  {
    name: '@spcsn/taro-binding-darwin-arm64',
    path: 'npm/darwin-arm64',
    nodeFile: 'taro.darwin-arm64.node',
    minSize: 1024 * 1024,
  },
];

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let hasErrors = false;
const errors: string[] = [];
const warnings: string[] = [];

console.log('🔍 验证 Binding 包完整性...\n');

for (const binding of bindings) {
  const bindingDir = resolve(rootDir, binding.path);
  const nodeFilePath = resolve(bindingDir, binding.nodeFile);
  const packageJsonPath = resolve(bindingDir, 'package.json');

  if (!existsSync(bindingDir)) {
    errors.push(`❌ ${binding.name}: 目录不存在 (${binding.path})`);
    hasErrors = true;
    continue;
  }

  if (!existsSync(packageJsonPath)) {
    errors.push(`❌ ${binding.name}: package.json 不存在`);
    hasErrors = true;
    continue;
  }

  if (!existsSync(nodeFilePath)) {
    errors.push(`❌ ${binding.name}: 缺少 ${binding.nodeFile} 文件`);
    hasErrors = true;
    continue;
  }

  const stats = statSync(nodeFilePath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  if (stats.size < binding.minSize) {
    errors.push(`❌ ${binding.name}: ${binding.nodeFile} 文件太小 (${fileSizeMB}MB)，可能构建失败`);
    hasErrors = true;
    continue;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
    if (packageJson.main !== binding.nodeFile) {
      warnings.push(
        `⚠️  ${binding.name}: package.json 的 main 字段 (${packageJson.main}) 与预期不符 (${binding.nodeFile})`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`❌ ${binding.name}: 无法解析 package.json - ${message}`);
    hasErrors = true;
    continue;
  }

  console.log(`✅ ${binding.name}: ${binding.nodeFile} (${fileSizeMB}MB)`);
}

console.log('');

if (warnings.length > 0) {
  console.log('⚠️  警告:\n');
  warnings.forEach((warning) => console.log(warning));
  console.log('');
}

if (hasErrors) {
  console.log('❌ 验证失败:\n');
  errors.forEach((error) => console.log(error));
  console.log('\n💡 提示:');
  console.log('   1. 确保已运行构建命令: pnpm build:binding:release');
  console.log('   2. 确保 CI 构建产物已正确下载');
  console.log('   3. 确保已运行 artifacts 命令: pnpm artifacts');
  console.log('');
  process.exit(1);
}

console.log('✨ 所有 Binding 包验证通过！\n');
process.exit(0);
