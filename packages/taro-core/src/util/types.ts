export interface CliArgs {
  _: string[];
  [key: string]: boolean | number | string | string[] | undefined;
}

export type TemplateSourceType = 'git' | 'url';

export interface FileStat {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}
