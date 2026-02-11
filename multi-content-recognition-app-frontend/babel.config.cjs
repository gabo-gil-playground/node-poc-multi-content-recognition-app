module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind must be added as a preset for Expo SDK 54+,
    // otherwise Metro may treat entry files as Babel configs and
    // trigger ".plugins is not a valid Plugin property" errors.
    presets: ['babel-preset-expo', 'nativewind/babel']
  };
};

