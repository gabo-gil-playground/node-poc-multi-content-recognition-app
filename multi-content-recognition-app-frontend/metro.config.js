const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Load root .env so EXPO_PUBLIC_* are available at build time (this dir is frontend)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
