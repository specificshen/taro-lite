declare module 'download-git-repo' {
  function download(
    repository: string,
    destination: string,
    options: { clone?: boolean },
    callback: (error: Error | null) => void,
  ): void;

  export default download;
}
