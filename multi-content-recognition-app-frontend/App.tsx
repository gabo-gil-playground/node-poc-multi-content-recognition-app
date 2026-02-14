import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { isSpeechRecognitionModuleAvailable, speechRecognition } from './speechRecognitionAdapter';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

type InputMode = 'idle' | 'text' | 'voice' | 'photo';

const MAX_IMAGE_DIMENSION = 1080;
const IMAGE_QUALITY = 0.7;

/**
 * Backend base URL. Loaded from .env at build time (see metro.config.js).
 * EXPO_PUBLIC_* vars are inlined by Metro when bundling.
 */
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

const showToast = (message: string): void => {
  // Simple cross‑platform toast replacement. Could be replaced by a UI library.
  // eslint-disable-next-line no-alert
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-console
    console.warn('Toast:', message);
  } else {
    // eslint-disable-next-line no-console
    console.warn('Toast:', message);
  }
};

export default function App(): React.ReactElement {
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [textDraft, setTextDraft] = useState<string>('');
  const [isSpeechAvailable, setIsSpeechAvailable] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        // Initialize speech recognition
        if (!isSpeechRecognitionModuleAvailable || !speechRecognition) {
          setIsSpeechAvailable(false);
        } else {
          try {
            const { granted } = await speechRecognition.requestPermissionsAsync();
            const availability = await speechRecognition.getStateAsync();
            setIsSpeechAvailable(Boolean(granted && availability.isAvailable));
          } catch (error) {
            setIsSpeechAvailable(false);
          }
        }

        // Hide splash screen after a minimum delay (2 seconds as per requirement)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        // Error handling
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    void initializeApp();
  }, []);

  const handleSelectText = (): void => {
    setTextDraft('');
    setInputMode('text');
  };

  const handleConfirmText = (): void => {
    if (!textDraft.trim()) {
      showToast('Please enter some text before confirming.');
      return;
    }
    setRecognizedText(textDraft.trim());
    setInputMode('idle');
  };

  const handleCancelText = (): void => {
    setInputMode('idle');
  };

  const handleSelectVoice = async (): Promise<void> => {
    if (!isSpeechAvailable) {
      showToast('Speech recognition is not available on this device.');
      return;
    }
    setRecognizedText('');
    setInputMode('voice');
  };

  const startListening = async (): Promise<void> => {
    try {
      setIsListening(true);
      if (!speechRecognition) {
        showToast('Speech recognition module is not available in this environment.');
        setIsListening(false);
        return;
      }

      await speechRecognition.startAsync({
        onResult: (result: { text?: string }) => {
          if (result.text) {
            setRecognizedText(result.text);
          }
        },
        interimResults: true
      });
    } catch (error) {
      setIsListening(false);
      showToast('There was an error while starting voice recognition.');
    }
  };

  const stopListening = async (): Promise<void> => {
    try {
      if (speechRecognition) {
        await speechRecognition.stopAsync();
      }
      setIsListening(false);
      setInputMode('idle');
    } catch (error) {
      setIsListening(false);
      setInputMode('idle');
      showToast('There was an error while stopping voice recognition.');
    }
  };

  const handleSelectPhoto = async (): Promise<void> => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast('Image permissions are required to select a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
        mediaTypes: ['images']
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      
      if (!asset.uri) {
        showToast('Invalid image selected.');
        return;
      }

      const manipulated = await resizeAndCompressImage(asset);

      if (!manipulated || !manipulated.uri) {
        showToast('Failed to process image.');
        return;
      }

      await uploadImageForRecognition(manipulated);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Error processing photo: ${errorMessage}`);
    }
  };

  const resizeAndCompressImage = async (
    asset: ImagePicker.ImagePickerAsset
  ): Promise<ImageManipulator.ImageResult> => {
    const { width, height, uri } = asset;

    if (!width || !height) {
      throw new Error('Invalid image dimensions.');
    }

    const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height, 1);

    const targetWidth = Math.round(width * ratio);
    const targetHeight = Math.round(height * ratio);

    return ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: targetWidth,
            height: targetHeight
          }
        }
      ],
      {
        compress: IMAGE_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG
      }
    );
  };

  const uploadImageForRecognition = async (image: ImageManipulator.ImageResult): Promise<void> => {
    try {
      if (!image.uri) {
        showToast('Invalid image URI.');
        return;
      }

      const formData = new FormData();

      // React Native FormData format - use the URI directly as returned by ImageManipulator
      // For Android, the URI format is already correct
      // For iOS, we may need to ensure it's a file:// URI
      const imageUri = image.uri.startsWith('file://') ? image.uri : `file://${image.uri}`;
      
      formData.append('image', {
        uri: imageUri,
        name: 'photo.jpg',
        type: 'image/jpeg'
      } as any);

      const response = await fetch(`${BACKEND_URL}/api/v1/vision/recognize`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json'
          // DO NOT include Content-Type - React Native sets it automatically with boundary
        }
      });

      if (!response.ok) {
        const statusText = response.statusText || `HTTP ${response.status}`;
        let errorMessage = `Server error: ${statusText}`;
        
        try {
          const errorPayload = (await response.json()) as { error?: string } | null;
          if (errorPayload?.error) {
            errorMessage = errorPayload.error;
          }
        } catch {
          // If JSON parsing fails, use the status text
        }
        
        showToast(errorMessage);
        return;
      }

      const payload = (await response.json()) as { text: string };
      if (payload.text) {
        setRecognizedText(payload.text);
      } else {
        showToast('Received empty response from server.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Network error: ${errorMessage}. Please check your backend connection.`);
    }
  };

  const showTextModal = inputMode === 'text';
  const showVoiceModal = inputMode === 'voice';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>
              Multi Recognition POC
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' }}>
          <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '500', marginBottom: 16 }}>Input Mode</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={handleSelectText}
              style={{ flex: 1, backgroundColor: '#E0ECFF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BFDBFE' }}
            >
              <Text style={{ color: '#1D4ED8', fontWeight: '600', fontSize: 16 }}>Text</Text>
            </Pressable>
            <Pressable
              onPress={handleSelectVoice}
              style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
            >
              <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>Voice</Text>
              <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                {isSpeechAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSelectPhoto}
              style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
            >
              <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>Photo</Text>
              <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>AI Vision</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
          <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '500', marginBottom: 16 }}>Recognized Content</Text>
          <ScrollView
            style={{ flex: 1, borderRadius: 16, backgroundColor: '#F1F5F9', paddingHorizontal: 20, paddingVertical: 16, borderWidth: 1, borderColor: '#E2E8F0' }}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: recognizedText ? '#0F172A' : '#64748B',
                fontStyle: recognizedText ? 'normal' : 'italic'
              }}
            >
              {recognizedText || 'Your recognized text will appear here.'}
            </Text>
          </ScrollView>
        </View>

        <View style={{ height: 56, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' }} />
      </View>

      {/* Text input modal */}
      <Modal transparent visible={showTextModal} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>Type Your Content</Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>
              Enter text manually. It will be displayed in read-only mode after confirmation.
            </Text>
            <View style={{ borderRadius: 16, backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', minHeight: 120 }}>
              <TextInput
                value={textDraft}
                onChangeText={setTextDraft}
                placeholder="Start typing here..."
                placeholderTextColor="#94A3B8"
                multiline
                style={{ fontSize: 16, color: '#0F172A', minHeight: 120 }}
                autoFocus
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable
                onPress={handleCancelText}
                style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: '#F1F5F9' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmText}
                style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: '#1D4ED8' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voice capture modal */}
      <Modal transparent visible={showVoiceModal} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>Voice Recognition</Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
              Speak clearly. Your voice will be converted to text and displayed below.
            </Text>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <View
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isListening ? '#CFFAFE' : '#F1F5F9'
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isListening ? '#06B6D4' : '#1D4ED8'
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14, textAlign: 'center', paddingHorizontal: 8 }}>
                    {isListening ? 'Listening...' : 'Tap Start'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable
                onPress={stopListening}
                style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: '#F1F5F9' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>
                  {isListening ? 'Stop' : 'Close'}
                </Text>
              </Pressable>
              {!isListening && (
                <Pressable
                  onPress={startListening}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: '#1D4ED8' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Start</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
