#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type PackageJson = {
  name?: string;
  version?: string;
  private?: boolean;
  main?: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, unknown>;
  scripts?: Record<string, string>;
};

const rootDir = path.resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootPackage = readJson(path.join(rootDir, 'package.json'));
const expectedVersion = rootPackage.version ?? '';

const BUSINESS_ENTRY_PACKAGES = ['@spcsn/taro', '@spcsn/taro-components', '@spcsn/taro-cli'];

const PLANNED_INTERNAL_PACKAGES = [
  '@spcsn/taro-service',
  '@spcsn/taro-mini-runner',
  '@spcsn/taro-helper',
  '@spcsn/taro-shared',
  '@spcsn/taro-runtime',
];

const README_BUSINESS_DEPENDENCIES = {
  dependencies: ['@spcsn/taro', '@spcsn/taro-components'],
  devDependencies: ['@spcsn/taro-cli'],
};

const BUSINESS_ENTRY_ALLOWED_PEER_DEPENDENCIES: Record<string, string[]> = {
  '@spcsn/taro': ['@spcsn/taro-components', '@types/react'],
  '@spcsn/taro-components': [],
  '@spcsn/taro-cli': [],
};
const CLI_DISALLOWED_DIRECT_DEPENDENCIES = ['@spcsn/taro-components', '@spcsn/taro-shared'];
const TARO_DISALLOWED_DIRECT_DEPENDENCIES = ['@spcsn/taro-shared'];

const README_PATH = 'README.md';
const INTERNAL_GUIDANCE_DOC_PATHS = ['docs/package-consolidation.md', 'docs/taro-react-only-modernization.md'];
const BUSINESS_FIXTURE_PACKAGE_JSON_PATH = 'fixtures/taro-lite-sunshine-lab/package.json';
const BUSINESS_FIXTURE_CONFIG_PATH = 'fixtures/taro-lite-sunshine-lab/config/index.ts';
const CLI_DEFAULT_FIXTURE_PACKAGE_JSON_PATH = 'packages/taro-cli/tests/fixtures/default/package.json';
const BUSINESS_TEMPLATE_PACKAGE_JSON_PATH = 'packages/taro-cli/templates/default/package.json.tmpl';
const BUSINESS_VISIBLE_TYPE_DIRS = ['packages/taro/types', 'packages/taro-components/types'];

const errors: string[] = [];
const warnings: string[] = [];
let hasVersionErrors = false;
let hasDependencyBoundaryErrors = false;
let hasReadmeContractErrors = false;
let hasPublishSurfaceErrors = false;
let hasBusinessFixtureContractErrors = false;

const expectedPublicPackageNames = [...BUSINESS_ENTRY_PACKAGES, ...PLANNED_INTERNAL_PACKAGES];
const publicPackageJsonPaths = collectPublicPackageJsonPaths();
const publicPackageNames = publicPackageJsonPaths
  .map((packageJsonPath) => readJson(packageJsonPath).name)
  .filter(isString);
const privateWorkspacePackageNames = collectPrivateWorkspacePackageNames();

checkPackageVersions();
checkPublishSurfaceContract();
checkPublicDependencyBoundaries();
checkBusinessEntryRuntimeDependencyContract();
checkCliDependencyContract();
checkTaroDependencyContract();
checkBusinessEntryPeerDependencyContract();
checkReadmeBusinessDependencyContract();
checkReadmeInternalPackageContract();
checkInternalGuidanceDocContract();
checkBusinessFixtureDependencyContract();
checkCliDefaultFixtureDependencyContract();
checkBusinessFixtureConfigContract();
checkBusinessFixtureScriptContract();
checkBusinessTemplateScriptContract();
checkBusinessVisibleTypeContract();

if (warnings.length > 0) {
  globalThis.console.log('Warnings:\n');
  warnings.forEach((warning) => globalThis.console.log(`- ${warning}`));
  globalThis.console.log('');
}

if (errors.length > 0) {
  globalThis.console.log('Release readiness check failed:\n');
  errors.forEach((error) => globalThis.console.log(`- ${error}`));
  globalThis.console.log('\nHints:');
  if (hasVersionErrors) globalThis.console.log(`- Align package versions with root version ${expectedVersion}.`);
  if (hasDependencyBoundaryErrors)
    globalThis.console.log('- Remove private or excluded workspace packages from public package dependencies.');
  if (hasReadmeContractErrors)
    globalThis.console.log('- Keep README minimal business dependencies aligned with the supported public contract.');
  if (hasPublishSurfaceErrors)
    globalThis.console.log('- Keep package publish surface aligned with docs/package-consolidation.md.');
  if (hasBusinessFixtureContractErrors)
    globalThis.console.log('- Keep the business fixture limited to public business-facing @spcsn packages.');
  process.exit(1);
}

printPublishSurface();
globalThis.console.log('\nRelease readiness check passed.');

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

function checkPublishSurfaceContract() {
  const missingPackageNames = expectedPublicPackageNames.filter(
    (packageName) => !publicPackageNames.includes(packageName),
  );
  const unexpectedPackageNames = publicPackageNames.filter(
    (packageName) => !expectedPublicPackageNames.includes(packageName),
  );

  if (missingPackageNames.length > 0) {
    hasPublishSurfaceErrors = true;
    errors.push(`Publish surface is missing expected public packages: ${missingPackageNames.join(', ')}`);
  }

  if (unexpectedPackageNames.length > 0) {
    hasPublishSurfaceErrors = true;
    errors.push(`Publish surface contains unexpected public packages: ${unexpectedPackageNames.join(', ')}`);
  }
}

function checkPublicDependencyBoundaries() {
  for (const packageJsonPath of publicPackageJsonPaths) {
    const packageJson = readJson(packageJsonPath);
    const dependencyNames = collectDependencyNames(packageJson);
    const invalidDependencyNames = dependencyNames.filter((dependencyName) =>
      privateWorkspacePackageNames.includes(dependencyName),
    );

    if (invalidDependencyNames.length === 0) continue;

    hasDependencyBoundaryErrors = true;
    errors.push(
      `${relative(packageJsonPath)}: ${packageJson.name} depends on private or workspace-excluded packages: ${invalidDependencyNames.join(', ')}`,
    );
  }
}

function checkBusinessEntryRuntimeDependencyContract() {
  const businessEntryPackageJsonPaths = publicPackageJsonPaths.filter((packageJsonPath) =>
    BUSINESS_ENTRY_PACKAGES.includes(readJson(packageJsonPath).name ?? ''),
  );

  for (const packageJsonPath of businessEntryPackageJsonPaths) {
    const packageJson = readJson(packageJsonPath);
    const typeRuntimeDependencyNames = Object.keys(packageJson.dependencies || {}).filter((dependencyName) =>
      dependencyName.startsWith('@types/'),
    );

    if (typeRuntimeDependencyNames.length === 0) continue;

    hasDependencyBoundaryErrors = true;
    errors.push(
      `${relative(packageJsonPath)}: ${packageJson.name} dependencies must not expose TypeScript-only packages: ${typeRuntimeDependencyNames.join(', ')}`,
    );
  }
}

function checkCliDependencyContract() {
  const cliPackageJsonPath = publicPackageJsonPaths.find(
    (packageJsonPath) => readJson(packageJsonPath).name === '@spcsn/taro-cli',
  );
  if (!cliPackageJsonPath) return;

  const cliPackageJson = readJson(cliPackageJsonPath);
  const cliDependencyNames = Object.keys(cliPackageJson.dependencies || {});
  const invalidDependencyNames = cliDependencyNames.filter((dependencyName) =>
    CLI_DISALLOWED_DIRECT_DEPENDENCIES.includes(dependencyName),
  );
  if (invalidDependencyNames.length === 0) return;

  hasDependencyBoundaryErrors = true;
  errors.push(
    `${relative(cliPackageJsonPath)}: @spcsn/taro-cli must not directly depend on business entry packages: ${invalidDependencyNames.join(', ')}`,
  );
}

function checkTaroDependencyContract() {
  const taroPackageJsonPath = publicPackageJsonPaths.find(
    (packageJsonPath) => readJson(packageJsonPath).name === '@spcsn/taro',
  );
  if (!taroPackageJsonPath) return;

  const taroPackageJson = readJson(taroPackageJsonPath);
  const taroDependencyNames = Object.keys(taroPackageJson.dependencies || {});
  const invalidDependencyNames = taroDependencyNames.filter((dependencyName) =>
    TARO_DISALLOWED_DIRECT_DEPENDENCIES.includes(dependencyName),
  );
  if (invalidDependencyNames.length === 0) return;

  hasDependencyBoundaryErrors = true;
  errors.push(
    `${relative(taroPackageJsonPath)}: @spcsn/taro must not directly depend on disallowed internal packages: ${invalidDependencyNames.join(', ')}`,
  );
}

function checkBusinessEntryPeerDependencyContract() {
  const hiddenPackageNames = PLANNED_INTERNAL_PACKAGES;
  const businessEntryPackageJsonPaths = publicPackageJsonPaths.filter((packageJsonPath) =>
    BUSINESS_ENTRY_PACKAGES.includes(readJson(packageJsonPath).name ?? ''),
  );

  for (const packageJsonPath of businessEntryPackageJsonPaths) {
    const packageJson = readJson(packageJsonPath);
    const peerDependencyNames = Object.keys(packageJson.peerDependencies || {});
    const peerDependencyMetaNames = Object.keys(packageJson.peerDependenciesMeta || {});
    const allowedPeerDependencyNames = BUSINESS_ENTRY_ALLOWED_PEER_DEPENDENCIES[packageJson.name ?? ''] || [];
    const invalidPeerDependencyNames = peerDependencyNames.filter(
      (dependencyName) =>
        hiddenPackageNames.includes(dependencyName) || !allowedPeerDependencyNames.includes(dependencyName),
    );
    const invalidPeerDependencyMetaNames = peerDependencyMetaNames.filter(
      (dependencyName) => !peerDependencyNames.includes(dependencyName),
    );

    if (invalidPeerDependencyNames.length === 0 && invalidPeerDependencyMetaNames.length === 0) continue;

    hasDependencyBoundaryErrors = true;
    if (invalidPeerDependencyNames.length > 0) {
      errors.push(
        `${relative(packageJsonPath)}: ${packageJson.name} peerDependencies must not expose disallowed packages: ${invalidPeerDependencyNames.join(', ')}`,
      );
    }
    if (invalidPeerDependencyMetaNames.length > 0) {
      errors.push(
        `${relative(packageJsonPath)}: ${packageJson.name} peerDependenciesMeta must only describe declared peerDependencies: ${invalidPeerDependencyMetaNames.join(', ')}`,
      );
    }
  }
}

function checkReadmeBusinessDependencyContract() {
  const readmePath = path.join(rootDir, 'README.md');
  const readme = fs.readFileSync(readmePath, 'utf8');

  for (const [dependencySection, packageNames] of Object.entries(README_BUSINESS_DEPENDENCIES)) {
    for (const packageName of packageNames) {
      const dependencyPattern = new RegExp(`"${escapeRegExp(packageName)}"\\s*:\\s*"${escapeRegExp(expectedVersion)}"`);
      if (dependencyPattern.test(readme)) continue;

      hasReadmeContractErrors = true;
      errors.push(`README.md: minimal ${dependencySection} must include ${packageName} at version ${expectedVersion}`);
    }
  }
}

function checkReadmeInternalPackageContract() {
  const readme = fs.readFileSync(path.join(rootDir, README_PATH), 'utf8');
  const internalPluginPattern = /@spcsn\/taro-plugin-[\w-]+/g;
  const internalPluginNames = [...new Set(readme.match(internalPluginPattern) || [])];

  if (internalPluginNames.length === 0) return;

  hasReadmeContractErrors = true;
  errors.push(`README.md: business-facing docs must not mention internal plugins: ${internalPluginNames.join(', ')}`);
}

function checkInternalGuidanceDocContract() {
  for (const docPath of INTERNAL_GUIDANCE_DOC_PATHS) {
    const source = fs.readFileSync(path.join(rootDir, docPath), 'utf8');
    if (source.includes('不是业务接入指导')) continue;

    hasReadmeContractErrors = true;
    errors.push(
      `${docPath}: internal docs that mention package consolidation must state they are not business guidance.`,
    );
  }
}

function checkBusinessFixtureDependencyContract() {
  const packageJsonPath = path.join(rootDir, BUSINESS_FIXTURE_PACKAGE_JSON_PATH);
  const packageJson = readJson(packageJsonPath);
  const spcsnDependencyNames = collectDependencyNames(packageJson).filter((dependencyName) =>
    dependencyName.startsWith('@spcsn/'),
  );
  const invalidDependencyNames = spcsnDependencyNames.filter(
    (dependencyName) => !BUSINESS_ENTRY_PACKAGES.includes(dependencyName),
  );

  if (invalidDependencyNames.length === 0) return;

  hasBusinessFixtureContractErrors = true;
  errors.push(
    `${BUSINESS_FIXTURE_PACKAGE_JSON_PATH}: fixture must not depend on internal @spcsn packages: ${invalidDependencyNames.join(', ')}`,
  );
}

function checkCliDefaultFixtureDependencyContract() {
  const packageJson = readJson(path.join(rootDir, CLI_DEFAULT_FIXTURE_PACKAGE_JSON_PATH));
  const spcsnDependencyNames = collectDependencyNames(packageJson).filter((dependencyName) =>
    dependencyName.startsWith('@spcsn/'),
  );
  const invalidDependencyNames = spcsnDependencyNames.filter(
    (dependencyName) => !BUSINESS_ENTRY_PACKAGES.includes(dependencyName),
  );

  if (invalidDependencyNames.length === 0) return;

  hasBusinessFixtureContractErrors = true;
  errors.push(
    `${CLI_DEFAULT_FIXTURE_PACKAGE_JSON_PATH}: CLI default fixture must not depend on internal @spcsn packages: ${invalidDependencyNames.join(', ')}`,
  );
}

function checkBusinessFixtureScriptContract() {
  const packageJson = readJson(path.join(rootDir, BUSINESS_FIXTURE_PACKAGE_JSON_PATH));
  const buildScript = packageJson.scripts?.build;
  const devScript = packageJson.scripts?.dev;

  if (buildScript === 'taro build' && devScript === 'NODE_ENV=development TARO_MINIFY=true taro build --watch') return;

  hasBusinessFixtureContractErrors = true;
  errors.push(
    `${BUSINESS_FIXTURE_PACKAGE_JSON_PATH}: fixture scripts should use default weapp commands: "taro build" and "taro build --watch"`,
  );
}

function checkBusinessTemplateScriptContract() {
  const templatePackageJson = fs.readFileSync(path.join(rootDir, BUSINESS_TEMPLATE_PACKAGE_JSON_PATH), 'utf8');
  const hasDefaultBuildScript = templatePackageJson.includes('"build": "taro build"');
  const hasDefaultDevScript = templatePackageJson.includes('"dev": "taro build --watch"');
  const hasLegacyWeappScript =
    templatePackageJson.includes('build:weapp') || templatePackageJson.includes('--type weapp');

  if (hasDefaultBuildScript && hasDefaultDevScript && !hasLegacyWeappScript) return;

  hasBusinessFixtureContractErrors = true;
  errors.push(
    `${BUSINESS_TEMPLATE_PACKAGE_JSON_PATH}: business template scripts should use default weapp commands: "taro build" and "taro build --watch"`,
  );
}

function checkBusinessFixtureConfigContract() {
  const config = fs.readFileSync(path.join(rootDir, BUSINESS_FIXTURE_CONFIG_PATH), 'utf8');
  const internalPluginPattern = /@spcsn\/taro-plugin-[\w-]+/g;
  const internalPluginNames = [...new Set(config.match(internalPluginPattern) || [])];

  if (internalPluginNames.length === 0) return;

  hasBusinessFixtureContractErrors = true;
  errors.push(
    `${BUSINESS_FIXTURE_CONFIG_PATH}: fixture config must not expose internal plugins: ${internalPluginNames.join(', ')}`,
  );
}

function checkBusinessVisibleTypeContract() {
  const internalPackagePattern =
    /@spcsn\/(taro-runtime|taro-service|taro-mini-runner|taro-helper|taro-shared|taro-plugin-[\w-]+)/g;
  const unsupportedConfigExports = [
    /export \* from '\.\/h5'/,
    /export \* from '\.\/harmony'/,
    /export \* from '\.\/rn'/,
  ];
  const configIndexPath = path.join(rootDir, 'packages/taro/types/compile/config/index.d.ts');
  const configIndexSource = fs.readFileSync(configIndexPath, 'utf8');
  const exposesUnsupportedConfig = unsupportedConfigExports.some((pattern) => pattern.test(configIndexSource));
  const unsupportedConfigTypePaths = [
    'packages/taro/types/compile/config/h5.d.ts',
    'packages/taro/types/compile/config/harmony.d.ts',
    'packages/taro/types/compile/config/rn.d.ts',
  ];
  const unsupportedApiTypePaths = [
    'packages/taro/types/api/alipay',
    'packages/taro/types/api/qq',
    'packages/taro/types/api/swan',
  ];
  const unsupportedApiReferencePatterns = [
    /<reference path="api\/alipay\//,
    /<reference path="api\/qq\//,
    /<reference path="api\/swan\//,
  ];
  const supportedConfigTypePaths = [
    'packages/taro/types/compile/compiler.d.ts',
    'packages/taro/types/compile/config/mini.d.ts',
    'packages/taro/types/compile/config/plugin.d.ts',
    'packages/taro/types/compile/config/project.d.ts',
    'packages/taro/types/compile/config/util.d.ts',
    'packages/taro/types/compile/viteCompilerContext.d.ts',
  ];
  const externalBuildTypeImportPattern = /from ['"](webpack|webpack-chain|rollup|postcss)['"]/g;
  const unsupportedCompilerContextPattern = /Vite(H5|Harmony)(BuildConfig|CompilerContext)|IH5Config|IHarmonyConfig/g;
  const unsupportedBusinessVisibleTypePatterns = [
    {
      path: 'packages/taro/types/taro.config.d.ts',
      pattern:
        /allowsBounceVertical|backgroundImageColor|backgroundImageUrl|defaultTitle|enableScrollBar|gestureBack|pullRefresh|responsive|showTitleLoading|transparentTitle|titlePenetrate|titleImage|titleBarColor|optionMenu|barButtonTheme|useDynamicPlugins|enableTTDom|interface Behavior\b|behavior\?: Behavior|animation\?: RouterAnimate/g,
      message: 'business-visible app/page config types must not expose unsupported H5/Alipay/TT fields.',
    },
    {
      path: 'packages/taro/types/taro.component.d.ts',
      pattern: /onKeyboardHeight\?/g,
      message: 'business-visible lifecycle types must not expose unsupported Alipay lifecycle hooks.',
    },
    {
      path: 'packages/taro-components/types/Button.d.ts',
      pattern: /keyof openTypeKeys\['(alipay|qq|tt|ascf)'\]|\b(alipay|qq|tt|ascf): \{/g,
      message: 'business-visible Button open-type types must only expose WeApp supported values.',
    },
    {
      path: 'packages/taro/types/api/taro.hooks.d.ts',
      pattern: /useTitleClick|useOptionMenuClick|useKeyboardHeight|usePullIntercept/g,
      message: 'business-visible hooks must not expose unsupported Alipay/H5 lifecycle hooks.',
    },
    {
      path: 'packages/taro/types/api/base/env.d.ts',
      pattern: /FRAMEWORK: 'react' \||TARO_ENV: 'weapp' \|/g,
      message: 'business-visible env types must only expose React + WeApp values.',
    },
    {
      path: 'packages/taro/types/api/taro.extend.d.ts',
      pattern: /rnNavigationRef|ENV_TYPE\.(SWAN|ALIPAY|TT|QQ|JD|WEB|RN|HARMONY|QUICKAPP|HARMONYHYBRID|ASCF)/g,
      message: 'business-visible Taro extension types must not expose unsupported platform env values.',
    },
    {
      path: 'packages/taro/types/global.d.ts',
      pattern: /\b(ASCF|SWAN|ALIPAY|TT|QQ|JD|WEB|RN|HARMONY|QUICKAPP|HARMONYHYBRID) = /g,
      message: 'business-visible global ENV_TYPE must only expose WeApp.',
    },
    {
      path: 'packages/taro/types/compile/config/util.d.ts',
      pattern:
        /targetUnit\?: 'rpx' \||baseFontSize|maxRootSize|minRootSize|platform\?: 'weapp' \||IPostcssOption<T extends 'h5'|'h5' \| 'harmony'|\b(SWAN|ALIPAY|TT|QQ|QUICKAPP) = /g,
      message: 'business-visible compile utility types must not expose H5/Harmony px/postcss config branches.',
    },
    {
      path: 'packages/taro/types/compile/compiler.d.ts',
      pattern: /Compiler<T extends CompilerTypes = CompilerWebpackTypes>/g,
      message: 'business-visible compiler type defaults must prefer Vite.',
    },
    {
      path: 'packages/taro/types/compile/config/project.d.ts',
      pattern:
        /CompilerWebpackTypes|framework\?: 'react' \||framework\?: 'react' \| 'preact'|可选值：react、preact|可选值：webpack5/g,
      message: 'business-visible project config types must only expose React + Vite defaults.',
    },
    {
      path: 'packages/taro/types/compile/config/mini.d.ts',
      pattern: /CompilerWebpackTypes/g,
      message: 'business-visible mini config types must default to Vite.',
    },
    {
      path: 'packages/taro-cli/src/util/define-config.ts',
      pattern: /CompilerWebpackTypes/g,
      message: 'defineConfig public helper must default to Vite.',
    },
    {
      path: 'packages/taro/types/api/taro.hooks.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@h5\b/g,
      message: 'business-visible hook comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/base/env.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b/g,
      message: 'business-visible env comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/taro.extend.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|Vue3|\bVue\b/g,
      message: 'business-visible extension comments must not advertise unsupported platforms or frameworks.',
    },
    {
      path: 'packages/taro/types/api/ui/custom-component.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/background.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/menu.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/window.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/pull-down-refresh.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/scroll.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/navigation-bar.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/tab-bar.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/fonts.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible UI comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/wxml/index.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b|Harmony/g,
      message: 'business-visible WXML comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/animation.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible animation comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ui/interaction.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible interaction comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/navigate/index.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible navigate comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/route/index.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible route comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/framework/index.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible framework comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ad/index.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|rn|h5)\b/g,
      message: 'business-visible ad comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/payment/index.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible payment comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/ext/index.d.ts',
      pattern: /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|rn|h5)\b/g,
      message: 'business-visible ext comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/location/index.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible location comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/network/request.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible request comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/network/upload.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible upload comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/network/download.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible download comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/network/websocket.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible websocket comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/storage/background-fetch.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible background fetch comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/storage/index.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible storage comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/data-analysis/index.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible data analysis comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/files/index.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible files comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/canvas/index.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible canvas comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/motion.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible motion comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/screen.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible screen comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/accelerometer.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible accelerometer comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/memory.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible memory comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/compass.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible compass comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/gyroscope.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible gyroscope comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/bluetooth.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible bluetooth comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/bluetooth-ble.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible BLE comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/bluetooth-peripheral.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible BLE peripheral comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/wifi.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible Wi-Fi comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/keyboard.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible keyboard comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/iBeacon.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible iBeacon comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/clipboard.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible clipboard comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/vibrate.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible vibrate comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/sms.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible SMS comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/accessibility.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible accessibility comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/network.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible network comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/battery.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible battery comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/scan.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible scan comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/calendar.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible calendar comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/phone.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible phone comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/device/nfc.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible NFC comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/open-api/subscribe-message.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible subscribe message comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/open-api/address.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible address comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/open-api/account.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible account comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/open-api/login.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible login comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/base/debug.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible debug comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/base/performance.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible performance comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/base/update.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible update comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/base/index.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible base comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/base/weapp/app-event.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible app event comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/base/weapp/life-cycle.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible life cycle comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/base/system.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible system comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/share/index.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible share comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/media/recorder.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible recorder comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/media/camera.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible camera comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/media/background-audio.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible background audio comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/media/map.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible map comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/media/video.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible video comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/media/audio.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible audio comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/media/image.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible image comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/open-api/authorize.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible authorize comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/open-api/settings.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible settings comments must not advertise unsupported platforms.',
    },
    {
      path: 'packages/taro/types/api/open-api/user-info.d.ts',
      pattern:
        /@supported .*\b(alipay|swan|qq|tt|rn|h5|harmony|harmony_hybrid|quickapp|jd)\b|@(alipay|swan|tt|rn|h5)\b/g,
      message: 'business-visible user info comments must not advertise unsupported platforms.',
    },
  ];

  if (exposesUnsupportedConfig) {
    hasBusinessFixtureContractErrors = true;
    errors.push(
      `${relative(configIndexPath)}: business-visible config types must only export WeApp/Vite supported config.`,
    );
  }

  for (const typePath of unsupportedConfigTypePaths) {
    if (!fs.existsSync(path.join(rootDir, typePath))) continue;

    hasBusinessFixtureContractErrors = true;
    errors.push(`${typePath}: unsupported H5/RN/Harmony config type files must not be published.`);
  }

  for (const typePath of unsupportedApiTypePaths) {
    if (!fs.existsSync(path.join(rootDir, typePath))) continue;

    hasBusinessFixtureContractErrors = true;
    errors.push(`${typePath}: unsupported Alipay/QQ/Swan API type files must not be published.`);
  }

  const apiEntryPath = path.join(rootDir, 'packages/taro/types/taro.api.d.ts');
  const apiEntrySource = fs.readFileSync(apiEntryPath, 'utf8');
  const exposesUnsupportedApiTypes = unsupportedApiReferencePatterns.some((pattern) => pattern.test(apiEntrySource));
  if (exposesUnsupportedApiTypes) {
    hasBusinessFixtureContractErrors = true;
    errors.push(
      `${relative(apiEntryPath)}: business-visible API types must only expose WeApp supported API references.`,
    );
  }

  for (const typeContract of unsupportedBusinessVisibleTypePatterns) {
    const typePath = path.join(rootDir, typeContract.path);
    const source = fs.readFileSync(typePath, 'utf8');
    const unsupportedTypeMatches = [...new Set(source.match(typeContract.pattern) || [])];
    if (unsupportedTypeMatches.length === 0) continue;

    hasBusinessFixtureContractErrors = true;
    errors.push(`${typeContract.path}: ${typeContract.message} ${unsupportedTypeMatches.join(', ')}`);
  }

  for (const typePath of supportedConfigTypePaths) {
    const source = fs.readFileSync(path.join(rootDir, typePath), 'utf8');
    const externalBuildTypeImports = [...new Set(source.match(externalBuildTypeImportPattern) || [])];
    const unsupportedCompilerContextTypes = [...new Set(source.match(unsupportedCompilerContextPattern) || [])];
    if (externalBuildTypeImports.length === 0 && unsupportedCompilerContextTypes.length === 0) continue;

    hasBusinessFixtureContractErrors = true;
    if (externalBuildTypeImports.length > 0) {
      errors.push(
        `${typePath}: business-visible supported config types must not require legacy build tool type packages: ${externalBuildTypeImports.join(', ')}`,
      );
    }
    if (unsupportedCompilerContextTypes.length > 0) {
      errors.push(
        `${typePath}: business-visible Vite compiler context must only expose WeApp/Mini supported types: ${unsupportedCompilerContextTypes.join(', ')}`,
      );
    }
  }

  for (const typeDir of BUSINESS_VISIBLE_TYPE_DIRS) {
    const typeFilePaths = collectFiles(path.join(rootDir, typeDir), '.d.ts');
    for (const typeFilePath of typeFilePaths) {
      const source = fs.readFileSync(typeFilePath, 'utf8');
      const internalPackageNames = [...new Set(source.match(internalPackagePattern) || [])];
      if (internalPackageNames.length === 0) continue;

      hasBusinessFixtureContractErrors = true;
      errors.push(
        `${relative(typeFilePath)}: business-visible types must not reference internal packages: ${internalPackageNames.join(', ')}`,
      );
    }
  }
}

function printPublishSurface() {
  globalThis.console.log('Business entry packages:\n');
  printPackageGroup(BUSINESS_ENTRY_PACKAGES);

  globalThis.console.log('\nPlanned internal packages still published for install compatibility:\n');
  printPackageGroup(PLANNED_INTERNAL_PACKAGES);

  const otherPackageNames = publicPackageNames.filter(
    (packageName) => !expectedPublicPackageNames.includes(packageName),
  );
  if (otherPackageNames.length > 0) {
    globalThis.console.log('\nOther public packages:\n');
    printPackageGroup(otherPackageNames);
  }
}

function printPackageGroup(packageNames: string[]): void {
  packageNames.forEach((packageName) => globalThis.console.log(`- ${packageName}`));
}

function collectPackageJsonPaths(): string[] {
  return collectChildPackageJsons(path.join(rootDir, 'packages'));
}

function collectPublicPackageJsonPaths(): string[] {
  return collectPackageJsonPaths().filter((packageJsonPath) => readJson(packageJsonPath).private !== true);
}

function collectPrivateWorkspacePackageNames(): string[] {
  const workspacePackageJsonPaths = collectChildPackageJsons(path.join(rootDir, 'packages'));

  return workspacePackageJsonPaths
    .map((packageJsonPath) => readJson(packageJsonPath))
    .filter((packageJson) => packageJson.private === true)
    .map((packageJson) => packageJson.name)
    .filter(isString);
}

function collectDependencyNames(packageJson: PackageJson): string[] {
  return [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.optionalDependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
  ];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectChildPackageJsons(parentDir: string): string[] {
  if (!fs.existsSync(parentDir)) return [];

  return fs
    .readdirSync(parentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => path.join(parentDir, entry.name, 'package.json'))
    .filter((packageJsonPath) => fs.existsSync(packageJsonPath));
}

function collectFiles(parentDir: string, extension: string): string[] {
  if (!fs.existsSync(parentDir)) return [];

  return fs.readdirSync(parentDir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(parentDir, entry.name);
    if (entry.isDirectory()) return collectFiles(filePath, extension);
    if (entry.isFile() && filePath.endsWith(extension)) return [filePath];
    return [];
  });
}

function readJson(filePath: string): PackageJson {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as PackageJson;
}

function relative(filePath: string): string {
  return path.relative(rootDir, filePath);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
