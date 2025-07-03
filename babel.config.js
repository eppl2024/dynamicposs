module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        // Removed 'expo-modules-core' from untranspiledModules to allow proper TypeScript transpilation
      }],
    ],
  };
};