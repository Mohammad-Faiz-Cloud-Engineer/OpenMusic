const { withPodfile } = require('@expo/config-plugins');

module.exports = function withFmtConstevalFix(config) {
  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('FMT_USE_CONSTEVAL')) {
      return config;
    }

    const piMatch = contents.match(/^(\s*)post_install\s+do\s+\|installer\|/m);
    if (!piMatch) {
      console.warn('[withFmtConstevalFix] No post_install block found in Podfile');
      return config;
    }

    const indent = piMatch[1];
    const afterPi = contents.slice(piMatch.index + piMatch[0].length);
    const endRe = new RegExp(`^${indent}end\\b`, 'm');
    const endMatch = afterPi.match(endRe);
    if (!endMatch) {
      console.warn('[withFmtConstevalFix] Could not find closing end of post_install block');
      return config;
    }

    const bi = indent + '  ';
    const insertion = `
${bi}# --- withCpp20: disable consteval in fmt 11.0.2 ---
${bi}installer.pods_project.targets.each do |target|
${bi}  target.build_configurations.each do |build_config|
${bi}    existing = build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS']
${bi}    existing = ['$(inherited)'] if existing.nil?
${bi}    existing = [existing] unless existing.is_a?(Array)
${bi}    existing << 'FMT_USE_CONSTEVAL=0' unless existing.include?('FMT_USE_CONSTEVAL=0')
${bi}    build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = existing
${bi}  end
${bi}end
${bi}# --- end withCpp20 ---
`;

    const insertPos = piMatch.index + piMatch[0].length + endMatch.index;
    contents = contents.slice(0, insertPos) + insertion + contents.slice(insertPos);
    config.modResults.contents = contents;
    return config;
  });
};
