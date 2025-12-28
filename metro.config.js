const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add tflite as a supported asset extension for TensorFlow Lite models
config.resolver.assetExts.push("tflite");

module.exports = config;
