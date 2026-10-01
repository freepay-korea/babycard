import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.toddler.firstwords',
  appName: '토닥토닥 첫 낱말',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    },
    TextToSpeech: {
      // Config for capacitor community tts
    },
  },
};

export default config;
