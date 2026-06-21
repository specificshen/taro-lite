export interface CliArgs {
  _: string[];
  [key: string]: boolean | number | string | string[] | undefined;
}

export interface FileStat {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}
