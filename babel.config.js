module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Strip console.* calls in production builds — removes devLog
      // call sites and any stray console.log from dependencies.
      // babel-preset-expo sets NODE_ENV=production for release builds.
      ...(process.env.NODE_ENV === 'production'
        ? [['transform-remove-console']]
        : []),
    ],
  };
};
