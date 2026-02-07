// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const defualtConfig = getDefaultConfig(__dirname);
defualtConfig.resolver.sourceExts.push('cjs');

module.exports = defualtConfig;
