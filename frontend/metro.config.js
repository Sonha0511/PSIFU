const { getDefaultConfig } = require('expo/metro-config');

// No project source imports SVG as a React component. Keeping Expo's default
// transformer avoids a Metro transformer-version conflict in Expo Go.
module.exports = getDefaultConfig(__dirname);
