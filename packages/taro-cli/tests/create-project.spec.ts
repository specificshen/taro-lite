import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CompilerType,
  createProject,
  CSSType,
  FrameworkType,
  NpmType,
  PeriodType,
} from '../src/create/template-creator';

const packageRoot = path.resolve(__dirname, '..');
const templateCreator = require('../templates/default/template_creator.js') as {
  handler: Parameters<typeof createProject>[1];
};

let temporaryRoot = '';

describe('createProject', () => {
  afterEach(() => {
    if (temporaryRoot) {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
      temporaryRoot = '';
    }
    vi.restoreAllMocks();
  });

  it('should create default React Vite project from TypeScript implementation', async () => {
    temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'taro-cli-create-project-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await createProject(
      {
        projectRoot: temporaryRoot,
        projectName: 'demo-app',
        template: 'default',
        npm: NpmType.Pnpm,
        framework: FrameworkType.React,
        css: CSSType.None,
        autoInstall: false,
        templateRoot: packageRoot,
        version: '1.0.0',
        typescript: true,
        date: '2026-06-06',
        description: 'Demo app',
        compiler: CompilerType.Vite,
        period: PeriodType.CreateAPP,
      },
      templateCreator.handler,
    );

    const projectRoot = path.join(temporaryRoot, 'demo-app');
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const pageSource = fs.readFileSync(path.join(projectRoot, 'src/pages/index/index.tsx'), 'utf8');

    expect(packageJson.name).toBe('demo-app');
    expect(packageJson.description).toBe('Demo app');
    expect(packageJson.templateInfo).toEqual({
      name: 'default',
      typescript: true,
      css: 'None',
      framework: 'React',
    });
    expect(fs.existsSync(path.join(projectRoot, 'tsconfig.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'src/app.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'src/app.css'))).toBe(true);
    expect(pageSource).toContain('export default function Index');
  });
});
