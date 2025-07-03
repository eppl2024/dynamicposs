module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        // Include expo-modules-core in untranspiledModules to ensure proper TypeScript transpilation
        untranspiledModules: ['expo-modules-core']
      }],
    ],
  };
};