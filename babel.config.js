module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        untranspiledModules: [
          'expo-modules-core',
        ],
      }],
    ],
  };
};