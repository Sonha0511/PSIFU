const { withProjectBuildGradle } = require('@expo/config-plugins');

// Jitsi SDK 13.2.0 still reads these legacy root-project extras. Expo SDK 57
// supplies the Android Gradle Plugin through its plugin system instead, so the
// compatibility values must be restored during prebuild.
module.exports = function withJitsiGradleCompatibility(config) {
  return withProjectBuildGradle(config, (nextConfig) => {
    const marker = 'PSIFU Jitsi Gradle compatibility';
    if (!nextConfig.modResults.contents.includes(marker)) {
      const extras = `// ${marker}\next {\n  gradlePluginVersion = "8.12.0"\n  compileSdkVersion = 36\n  minSdkVersion = 24\n  targetSdkVersion = 36\n}\n\n`;
      nextConfig.modResults.contents = nextConfig.modResults.contents.replace('buildscript {', `${extras}buildscript {`);
    }
    return nextConfig;
  });
};
