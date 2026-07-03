const { withPodfile } = require('@expo/config-plugins');

module.exports = function withFmtConstevalFix(config) {
  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('FMT_USE_CONSTEVAL')) {
      return config;
    }

    contents += `

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      existing = build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS']
      existing = ['$(inherited)'] if existing.nil?
      existing = [existing] unless existing.is_a?(Array)
      existing << 'FMT_USE_CONSTEVAL=0' unless existing.include?('FMT_USE_CONSTEVAL=0')
      build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = existing
    end
  end
end
`;

    config.modResults.contents = contents;
    return config;
  });
};
