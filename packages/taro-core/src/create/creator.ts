import * as path from 'node:path';
import { fs } from '@spcsn/taro-helper';
import { getRootPath } from '../util/index.js';

export default class Creator {
  protected _rootPath!: string;
  public rootPath: string;

  constructor(sourceRoot?: string) {
    this.rootPath = this.sourceRoot(sourceRoot || path.join(getRootPath()));
    this.init();
  }

  init(): void {}

  sourceRoot(rootPath?: string): string {
    if (typeof rootPath === 'string') {
      this._rootPath = path.resolve(rootPath);
    }
    if (!fs.existsSync(this._rootPath)) {
      fs.ensureDirSync(this._rootPath);
    }
    return this._rootPath;
  }

  templatePath(...args: string[]): string {
    let filepath = path.join(...args);
    if (!path.isAbsolute(filepath)) {
      filepath = path.join(this._rootPath, 'templates', filepath);
    }
    return filepath;
  }

  write(): void {}
}
