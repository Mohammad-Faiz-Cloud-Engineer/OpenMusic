/**
 * Validates that the project can compile and has required Expo / entry configuration.
 * Used by `npm run build:check` and by Jest build tests.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const REQUIRED_FILES = [
  'App.tsx',
  'index.ts',
  'app.json',
  'package.json',
  'package-lock.json',
  'babel.config.js',
  'metro.config.js',
  'tsconfig.json',
  'assets/icon.png',
  'assets/splash-icon.png',
];

function assertFile(relativePath) {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

function validatePackageJson() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  if (!pkg.main) throw new Error('package.json: "main" entry is required');
  if (!pkg.scripts?.test) throw new Error('package.json: "test" script is required');
  if (!fs.existsSync(path.join(ROOT, pkg.main))) {
    throw new Error(`package.json: main file "${pkg.main}" does not exist`);
  }
}

function validateAppJson() {
  const app = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
  const expo = app.expo;
  if (!expo) throw new Error('app.json: missing "expo" key');
  if (!expo.name) throw new Error('app.json: expo.name is required');
  if (!expo.slug) throw new Error('app.json: expo.slug is required');
  if (!expo.scheme) throw new Error('app.json: expo.scheme is required for deep linking');
  if (!expo.icon || !fs.existsSync(path.join(ROOT, expo.icon))) {
    throw new Error('app.json: expo.icon must point to an existing file');
  }
  const iosModes = expo.ios?.infoPlist?.UIBackgroundModes ?? [];
  if (!iosModes.includes('audio')) {
    throw new Error('app.json: ios UIBackgroundModes must include "audio" for background playback');
  }
  if (!expo.android?.package) {
    throw new Error('app.json: android.package is required for Play Store builds');
  }
  if (!Number.isInteger(expo.android?.versionCode) || expo.android.versionCode < 1) {
    throw new Error('app.json: android.versionCode must be a positive integer');
  }
  if (!expo.android?.adaptiveIcon?.foregroundImage ||
      !fs.existsSync(path.join(ROOT, expo.android.adaptiveIcon.foregroundImage))) {
    throw new Error('app.json: android.adaptiveIcon.foregroundImage must point to an existing file');
  }
}

function validateTsConfig() {
  const ts = JSON.parse(fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf8'));
  if (!ts.compilerOptions?.strict) {
    throw new Error('tsconfig.json: strict mode should be enabled');
  }
}

function runTypeScriptCheck() {
  execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
}

function validateProjectStructure() {
  REQUIRED_FILES.forEach(assertFile);
  validatePackageJson();
  validateAppJson();
  validateTsConfig();
}

function runBuildCheck({ skipTypecheck = false } = {}) {
  validateProjectStructure();
  if (!skipTypecheck) {
    runTypeScriptCheck();
  }
}

module.exports = {
  ROOT,
  assertFile,
  validateAppJson,
  validatePackageJson,
  validateTsConfig,
  validateProjectStructure,
  runTypeScriptCheck,
  runBuildCheck,
};

if (require.main === module) {
  try {
    runBuildCheck();
    console.log('Build check passed: structure OK, TypeScript OK');
    process.exit(0);
  } catch (err) {
    console.error('Build check failed:', err.message || err);
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    process.exit(1);
  }
}
