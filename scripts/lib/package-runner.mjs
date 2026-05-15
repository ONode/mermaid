import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * @typedef {'bun' | 'pnpm' | 'npm'} PackageManager
 */

/**
 * Prefer pnpm when its lockfile exists; otherwise Bun when only `bun.lock` is present.
 * @param {string} root
 * @returns {PackageManager}
 */
export function detectPackageManager(root) {
  if (existsSync(join(root, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(join(root, 'bun.lock'))) {
    return 'bun';
  }
  return 'npm';
}

/**
 * @param {PackageManager} pm
 * @param {string} scriptName
 * @returns {string[]}
 */
export function runScriptArgs(pm, scriptName) {
  return ['run', scriptName];
}

/**
 * @param {PackageManager} pm
 * @param {string} scriptName
 * @param {string} cwd
 * @param {import('node:child_process').SpawnSyncOptions} [options]
 */
export function spawnPackageScript(pm, scriptName, cwd, options) {
  const cmd = pm === 'npm' ? 'npm' : pm;
  const args = runScriptArgs(pm, scriptName);
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd, ...options });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/** @type {PackageManager[]} */
const pmFallbackOrder = ['pnpm', 'bun', 'npm'];

/**
 * If the lockfile-preferred PM is not installed (ENOENT), try others.
 * @param {PackageManager} preferredPm
 * @param {string} scriptName
 * @param {string} cwd
 * @param {import('node:child_process').SpawnSyncOptions} [options]
 */
export function spawnPackageScriptWithPathFallback(preferredPm, scriptName, cwd, options) {
  const tryOrder = [preferredPm, ...pmFallbackOrder.filter((p) => p !== preferredPm)];
  /** @type {NodeJS.ErrnoException | undefined} */
  let lastENOENT;

  for (const pm of tryOrder) {
    const cmd = pm === 'npm' ? 'npm' : pm;
    const args = runScriptArgs(pm, scriptName);
    const result = spawnSync(cmd, args, { stdio: 'inherit', cwd, ...options });
    if (result.error) {
      const err = /** @type {NodeJS.ErrnoException} */ (result.error);
      if (err.code === 'ENOENT') {
        lastENOENT = err;
        continue;
      }
      throw result.error;
    }
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
    return;
  }

  throw lastENOENT ?? new Error(`No package manager on PATH to run "${scriptName}" in ${cwd}`);
}
