const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  // Add additional file extensions for asset bundling
  const assetExts = defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg');
  assetExts.push('bin');

  defaultConfig.resolver.assetExts = assetExts;

  return defaultConfig;
})();
