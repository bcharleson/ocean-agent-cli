import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function findPackageJson(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) {
      const raw = readFileSync(candidate, 'utf8');
      const pkg = JSON.parse(raw) as { name?: string };
      if (pkg.name === 'ocean-agent-cli') {
        return candidate;
      }
    }
    dir = dirname(dir);
  }
  throw new Error('Could not locate ocean-agent-cli package.json');
}

const pkg = JSON.parse(readFileSync(findPackageJson(), 'utf8')) as { version: string };

export const CLI_VERSION = pkg.version;
