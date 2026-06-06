import { rm, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);

if (args.includes('--node-modules')) {
  await removeNodeModules(process.cwd());
} else {
  const targetDirs = args.length > 0 ? args : ['dist'];
  await Promise.all(
    targetDirs.map((targetDir) => rm(resolve(process.cwd(), targetDir), { recursive: true, force: true })),
  );
}

async function removeNodeModules(currentDir: string): Promise<void> {
  const entries = await readDirectoryEntries(currentDir);

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory()) return;

      const entryPath = join(currentDir, entry.name);
      if (entry.name === 'node_modules') {
        await rm(entryPath, { recursive: true, force: true });
        return;
      }

      await removeNodeModules(entryPath);
    }),
  );
}

async function readDirectoryEntries(currentDir: string) {
  try {
    return await readdir(currentDir, { withFileTypes: true });
  } catch {
    return [];
  }
}
