const {
  assertFile,
  validateAppJson,
  validatePackageJson,
  validateProjectStructure,
  validateTsConfig,
  runTypeScriptCheck,
  runBuildCheck,
} = require('../../scripts/build-check');

describe('project build check', () => {

  it('includes required project files', () => {
    expect(() => validateProjectStructure()).not.toThrow();
  });

  it('has a valid package.json with resolvable main entry', () => {
    expect(() => validatePackageJson()).not.toThrow();
  });

  it('has a valid Expo app.json (scheme, icon, background audio)', () => {
    expect(() => validateAppJson()).not.toThrow();
  });

  it('enables TypeScript strict mode', () => {
    expect(() => validateTsConfig()).not.toThrow();
  });

  it('resolves the app entrypoint', () => {
    expect(() => assertFile('index.ts')).not.toThrow();
    expect(() => assertFile('App.tsx')).not.toThrow();
  });

  it('passes TypeScript compilation (tsc --noEmit)', () => {
    expect(() => runTypeScriptCheck()).not.toThrow();
  });

  it('passes the full build check pipeline', () => {
    expect(() => runBuildCheck()).not.toThrow();
  });
});
