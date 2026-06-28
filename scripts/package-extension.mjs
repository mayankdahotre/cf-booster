import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const manifestPath = join(distDir, 'manifest.json');

if (!existsSync(manifestPath)) {
  console.error('dist/manifest.json not found. Run "npm run build" first.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const zipName = `cf-booster-v${pkg.version}.zip`;
const zipPath = join(root, zipName);

if (existsSync(zipPath)) {
  rmSync(zipPath);
}

if (process.platform === 'win32') {
  const distGlob = join(distDir, '*');
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${distGlob}' -DestinationPath '${zipPath}' -Force"`,
    { stdio: 'inherit' },
  );
} else {
  execSync(`zip -r "${zipPath}" .`, { cwd: distDir, stdio: 'inherit' });
}

console.log(`\nCreated ${zipName}`);
console.log('Upload this file to GitHub Releases for users who prefer a pre-built zip.');
