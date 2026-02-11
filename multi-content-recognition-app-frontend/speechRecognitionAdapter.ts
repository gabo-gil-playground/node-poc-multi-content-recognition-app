import { Platform } from 'react-native';

// We keep the type deliberately broad to avoid a hard dependency
// when the native module is not available (e.g. Expo Go).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nativeModule: any | null = null;

try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    nativeModule = require('expo-speech-recognition');
  }
} catch {
  nativeModule = null;
}

export const speechRecognition = nativeModule;
export const isSpeechRecognitionModuleAvailable = Boolean(nativeModule);

