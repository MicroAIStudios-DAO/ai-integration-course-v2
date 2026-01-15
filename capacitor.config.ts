import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.microai.aicourse',
  appName: 'AI Integration Course',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
