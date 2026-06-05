#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BINDINGS = [
  {
    name: '@spcsn/taro-binding-darwin-x64',
    path: 'npm/darwin-x64',
    nodeFile: 'taro.darwin-x64.node',
    minSize: 1024 * 1024,
  },
  {
    name: '@spcsn/taro-binding-darwin-arm64',
    path: 'npm/darwin-arm64',
    nodeFile: 'taro.darwin-arm64.node',
    minSize: 1024 * 1024,
  },
  {
    name: '@spcsn/taro-binding-linux-x64-gnu',
    path: 'npm/linux-x64-gnu',
    nodeFile: 'taro.linux-x64-gnu.node',
    minSize: 1024 * 1024,
  },
  {
    name: '@spcsn/taro-binding-linux-x64-musl',
    path: 'npm/linux-x64-musl',
    nodeFile: 'taro.linux-x64-musl.node',
    minSize: 1024 * 1024,
  },
  {
    name: '@spcsn/taro-binding-linux-arm64-gnu',
    path: 'npm/linux-arm64-gnu',
    nodeFile: 'taro.linux-arm64-gnu.node',
    minSize: 1024 * 1024,
  },
  {
    name: '@spcsn/taro-binding-win32-x64-msvc',
    path: 'npm/win32-x64-msvc',
    nodeFile: 'taro.win32-x64-msvc.node',
    minSize: 1024 * 1024,
  },
];

const rootDir = path.resolve(__dirname, '..');
let hasErrors = false;
const errors = [];
const warnings = [];

globalThis.console.log('🔍 验证 Binding 包完整性...\n');

for (const binding of BINDINGS) {
  const bindingDir = path.join(rootDir, binding.path);
  const nodeFilePath = path.join(bindingDir, binding.nodeFile);
  const packageJsonPath = path.join(bindingDir, 'package.json');

  if (!fs.existsSync(bindingDir)) {
    errors.push(`❌ ${binding.name}: 目录不存在 (${binding.path})`);
    hasErrors = true;
    continue;
  }

  if (!fs.existsSync(packageJsonPath)) {
    errors.push(`❌ ${binding.name}: package.json 不存在`);
    hasErrors = true;
    continue;
  }

  if (!fs.existsSync(nodeFilePath)) {
    errors.push(`❌ ${binding.name}: 缺少 ${binding.nodeFile} 文件`);
    hasErrors = true;
    continue;
  }

  const stats = fs.statSync(nodeFilePath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  if (stats.size < binding.minSize) {
    errors.push(`❌ ${binding.name}: ${binding.nodeFile} 文件太小 (${fileSizeMB}MB)，可能构建失败`);
    hasErrors = true;
    continue;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.main !== binding.nodeFile) {
      warnings.push(
        `⚠️  ${binding.name}: package.json 的 main 字段 (${packageJson.main}) 与预期不符 (${binding.nodeFile})`,
      );
    }
  } catch (error) {
    errors.push(`❌ ${binding.name}: 无法解析 package.json - ${error.message}`);
    hasErrors = true;
    continue;
  }

  globalThis.console.log(`✅ ${binding.name}: ${binding.nodeFile} (${fileSizeMB}MB)`);
}

globalThis.console.log('');

if (warnings.length > 0) {
  globalThis.console.log('⚠️  警告:\n');
  warnings.forEach((warning) => globalThis.console.log(warning));
  globalThis.console.log('');
}

if (hasErrors) {
  globalThis.console.log('❌ 验证失败:\n');
  errors.forEach((error) => globalThis.console.log(error));
  globalThis.console.log('\n💡 提示:');
  globalThis.console.log('   1. 确保已运行构建命令: pnpm build:binding:release');
  globalThis.console.log('   2. 确保 CI 构建产物已正确下载');
  globalThis.console.log('   3. 确保已运行 artifacts 命令: pnpm artifacts');
  globalThis.console.log('');
  process.exit(1);
}

globalThis.console.log('✨ 所有 Binding 包验证通过！\n');
process.exit(0);
