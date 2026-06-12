declare module 'download-git-repo' {
  interface DownloadOptions {
    clone?: boolean;
    headers?: Record<string, string>;
  }

  type DownloadCallback = (error?: Error | string | null) => void;

  function download(
    repository: string,
    destination: string,
    options: DownloadOptions,
    callback: DownloadCallback,
  ): void;

  function download(repository: string, destination: string, callback: DownloadCallback): void;

  export = download;
}