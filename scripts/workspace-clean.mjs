/**
 * Run each workspace package's `clean` script (same effect as `pnpm run -r clean`).
 * When the script is `rimraf …`, delete those paths with fs.rmSync so we do not depend
 * on the rimraf CLI (or its Node version).
 */
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globbySync } from 'globby';
import { spawnPackageScriptWithPathFallback, detectPackageManager } from './lib/package-runner.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @returns {string[]}
 */
function workspacePackageJsonFiles() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const workspaces = pkg.workspaces ?? [];
  /** @type {string[]} */
  const paths = [];

  for (const w of workspaces) {
    if (w.endsWith('/*')) {
      const base = w.slice(0, -2);
      paths.push(
        ...globbySync(`${base}/*/package.json`, { cwd: root }).map((p) => join(root, p))
      );
    } else {
      const p = join(root, w, 'package.json');
      if (existsSync(p)) {
        paths.push(p);
      }
    }
  }

  return paths;
}

/**
 * @param {string} cwd
 * @param {string} cleanScript
 * @returns {boolean} true if handled (rimraf-only)
 */
function tryRunRimrafClean(cwd, cleanScript) {
  const trimmed = cleanScript.trim();
  if (!trimmed.startsWith('rimraf')) {
    return false;
  }
  const rest = trimmed.slice('rimraf'.length).trim();
  if (!rest) {
    return true;
  }
  const paths = rest.split(/\s+/).filter(Boolean);
  for (const rel of paths) {
    const target = join(cwd, rel);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }
  }
  return true;
}

const pm = detectPackageManager(root);

/** @type {{ dir: string; pkg: Record<string, unknown> }[]} */
const toClean = [];

const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (rootPkg.scripts?.clean) {
  toClean.push({ dir: root, pkg: rootPkg });
}

for (const pkgJsonPath of workspacePackageJsonFiles()) {
  const pkgDir = dirname(pkgJsonPath);
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  if (pkg.scripts?.clean) {
    toClean.push({ dir: pkgDir, pkg });
  }
}

for (const { dir, pkg } of toClean) {
  const clean = pkg.scripts?.clean;
  if (!clean) {
    continue;
  }
  if (tryRunRimrafClean(dir, clean)) {
    continue;
  }
  spawnPackageScriptWithPathFallback(pm, 'clean', dir);
}
