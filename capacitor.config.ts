import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.kinshasaflow.app',
  appName: 'Kinshasa Flow',
  webDir: 'out',
  server: {
    url: 'https://kinshasaflow.online',
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;