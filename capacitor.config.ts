import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.zakovat.timer',
  appName: 'Zakovat Timer',
  webDir: 'dist',
  backgroundColor: '#0f1117',
  ios: {
    contentInset: 'never',
    backgroundColor: '#0f1117',
  },
  android: {
    backgroundColor: '#0f1117',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0f1117',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f1117',
      overlaysWebView: false,
    },
    LocalNotifications: {
      // Keep scheduled notifications silent while the app is in the
      // foreground — the in-app sounds and haptics handle that case.
      presentationOptions: [],
    },
  },
};

export default config;
