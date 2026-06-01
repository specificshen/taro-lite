#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rootPackage = readJson(path.join(rootDir, 'package.json'));
const expectedVersion = rootPackage.version;
const skipBindings = process.argv.includes('--skip-bindings');

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

const errors = [];
const warnings = [];
let hasVersionErrors = false;
let hasBindingErrors = false;

checkPackageVersions();
if (!skipBindings) checkBindingPackages();

if (warnings.length > 0) {
  console.log('Warnings:\n');
  warnings.forEach((warning) => console.log(`- ${warning}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('Release readiness check failed:\n');
  errors.forEach((error) => console.log(`- ${error}`));
  console.log('\nHints:');
  if (hasVersionErrors) console.log(`- Align package versions with root version ${expectedVersion}.`);
  if (hasBindingErrors) console.log('- Run pnpm run artifacts before checking binding platform packages.');
  if (!skipBindings) console.log('- Use --skip-bindings only for a version-only local check.');
  process.exit(1);
}

console.log('Release readiness check passed.');

function checkPackageVersions() {
  const packageJsonPaths = collectPackageJsonPaths();

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = readJson(packageJsonPath);
    if (packageJson.private === true) continue;
    if (packageJson.version !== expectedVersion) {
      hasVersionErrors = true;
      errors.push(
        `${relative(packageJsonPath)}: ${packageJson.name} version is ${packageJson.version}, expected ${expectedVersion}`,
      );
    }
  }
}

function checkBindingPackages() {
  for (const binding of BINDINGS) {
    const bindingDir = path.join(rootDir, binding.path);
    const packageJsonPath = path.join(bindingDir, 'package.json');
    const nodeFilePath = path.join(bindingDir, binding.nodeFile);

    if (!fs.existsSync(bindingDir)) {
      hasBindingErrors = true;
      errors.push(`${binding.name}: missing directory ${binding.path}`);
      continue;
    }

    if (!fs.existsSync(packageJsonPath)) {
      hasBindingErrors = true;
      errors.push(`${binding.name}: missing package.json`);
      continue;
    }

    const packageJson = readJson(packageJsonPath);
    if (packageJson.main !== binding.nodeFile) {
      warnings.push(`${binding.name}: package.json main is ${packageJson.main}, expected ${binding.nodeFile}`);
    }

    if (!fs.existsSync(nodeFilePath)) {
      hasBindingErrors = true;
      errors.push(`${binding.name}: missing ${binding.nodeFile}`);
      continue;
    }

    const stats = fs.statSync(nodeFilePath);
    if (stats.size < binding.minSize) {
      hasBindingErrors = true;
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      errors.push(`${binding.name}: ${binding.nodeFile} is too small (${fileSizeMB}MB)`);
    }
  }
}

function collectPackageJsonPaths() {
  return [
    ...collectChildPackageJsons(path.join(rootDir, 'packages')),
    ...collectChildPackageJsons(path.join(rootDir, 'npm')),
    path.join(rootDir, 'crates/native_binding/package.json'),
  ];
}

function collectChildPackageJsons(parentDir) {
  if (!fs.existsSync(parentDir)) return [];

  return fs
    .readdirSync(parentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => path.join(parentDir, entry.name, 'package.json'))
    .filter((packageJsonPath) => fs.existsSync(packageJsonPath));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function relative(filePath) {
  return path.relative(rootDir, filePath);
}
