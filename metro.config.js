const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes("zustand")) {
    const result = require.resolve(moduleName); // gets CommonJS version
    return context.resolveRequest(context, result, platform);
  }
  // otherwise chain to the standard Metro resolver.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/app/global.css" });
