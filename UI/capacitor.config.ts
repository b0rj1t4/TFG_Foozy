import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Footzy',
  webDir: 'www',
  server: {
    androidScheme: 'http',
  },
  plugins: {
    BackgroundRunner: {
      label: 'com.capacitor.background.check',
      src: 'runners/runner.js',
      event: 'syncSteps',
      repeat: true,
      interval: 15, // minutes between runs
      autoStart: true,
    },
  },
};

export default config;
