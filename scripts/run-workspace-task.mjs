/**
 * Run a script in a workspace package directory, e.g.
 * `node scripts/run-workspace-task.mjs packages/mermaid types:build-config`
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectPackageManager, spawnPackageScriptWithPathFallback } from './lib/package-runner.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const relPkgDir = process.argv[2];
const scriptName = process.argv[3];

if (!relPkgDir || !scriptName) {
  console.error(
    'Usage: node scripts/run-workspace-task.mjs <path-from-root-to-pkg> <script-name>'
  );
  process.exit(1);
}

const cwd = resolve(root, relPkgDir);
const pm = detectPackageManager(root);
spawnPackageScriptWithPathFallback(pm, scriptName, cwd);
