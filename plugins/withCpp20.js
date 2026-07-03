const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withCpp20(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes('CLANG_CXX_LANGUAGE_STANDARD')) return config;

      const idx = contents.lastIndexOf('post_install do |installer|');
      if (idx < 0) return config;

      const closingEnd = contents.indexOf('end', idx);
      if (closingEnd < 0) return config;

      const insertion = `
    # --- withCpp20 plugin ---
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        build_config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
        build_config.build_settings['CLANG_CXX_LIBRARY'] = 'libc++'
      end
    end
    # --- end withCpp20 plugin ---
`;

      contents = contents.slice(0, closingEnd) + insertion + contents.slice(closingEnd);
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
