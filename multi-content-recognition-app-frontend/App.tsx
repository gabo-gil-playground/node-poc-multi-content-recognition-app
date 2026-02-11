import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, SafeAreaView, Text, TextInput, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { isSpeechRecognitionModuleAvailable, speechRecognition } from './speechRecognitionAdapter';

type InputMode = 'idle' | 'text' | 'voice' | 'photo';

const MAX_IMAGE_DIMENSION = 1080;
const IMAGE_QUALITY = 0.7;

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

export default function App(): JSX.Element {
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [textDraft, setTextDraft] = useState<string>('');
  const [isSpeechAvailable, setIsSpeechAvailable] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  useEffect(() => {
    const initSpeechRecognition = async (): Promise<void> => {
      try {
        if (!isSpeechRecognitionModuleAvailable || !speechRecognition) {
          setIsSpeechAvailable(false);
          return;
        }

        const { granted } = await speechRecognition.requestPermissionsAsync();
        const availability = await speechRecognition.getStateAsync();

        setIsSpeechAvailable(Boolean(granted && availability.isAvailable));
      } catch (error) {
        showToast('Speech recognition is not available on this device.');
        setIsSpeechAvailable(false);
      }
    };

    void initSpeechRecognition();
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
        onResult: (result) => {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const manipulated = await resizeAndCompressImage(asset);

      await uploadImageForRecognition(manipulated);
    } catch (error) {
      showToast('There was an error while processing the selected photo.');
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
      const formData = new FormData();

      formData.append('image', {
        // @ts-expect-error React Native type for File/Blob is not fully aligned with TS DOM lib
        uri: image.uri,
        name: 'photo.jpg',
        type: 'image/jpeg'
      });

      const response = await fetch(`${BACKEND_URL}/api/v1/vision/recognize`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        showToast(
          errorPayload?.error ?? 'Image could not be processed. Please verify the file and try again.'
        );
        return;
      }

      const payload = (await response.json()) as { text: string };
      setRecognizedText(payload.text);
    } catch (error) {
      showToast('There was a network error while sending the image to the server.');
    }
  };

  const showTextModal = inputMode === 'text';
  const showVoiceModal = inputMode === 'voice';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 pt-6 pb-4">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-textSecondary text-xs tracking-[0.15em] uppercase">
              Multi Recognition POC
            </Text>
            <Text className="text-2xl font-semibold text-textPrimary mt-1">
              Unified content capture
            </Text>
          </View>
        </View>

        <View className="bg-surface rounded-3xl shadow-lg shadow-slate-200 p-5 mb-5">
          <Text className="text-textSecondary text-xs mb-3">Input mode</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleSelectText}
              className="flex-1 bg-primarySoft rounded-2xl py-3 px-3 items-center justify-center"
            >
              <Text className="text-primary font-semibold">Text</Text>
            </Pressable>
            <Pressable
              onPress={handleSelectVoice}
              className="flex-1 bg-surfaceMuted rounded-2xl py-3 px-3 items-center justify-center"
            >
              <Text className="text-textPrimary font-semibold">Voice</Text>
              <Text className="text-[10px] text-textSecondary mt-1">
                {isSpeechAvailable ? 'Live transcription' : 'Unavailable'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSelectPhoto}
              className="flex-1 bg-surfaceMuted rounded-2xl py-3 px-3 items-center justify-center"
            >
              <Text className="text-textPrimary font-semibold">Photo</Text>
              <Text className="text-[10px] text-textSecondary mt-1">AI vision</Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-1 bg-surface rounded-3xl shadow-lg shadow-slate-200 p-5 mb-4">
          <Text className="text-textSecondary text-xs mb-3">Recognized content</Text>
          <ScrollView
            className="flex-1 rounded-2xl bg-surfaceMuted px-4 py-3"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <Text
              className={`text-sm leading-relaxed text-textPrimary ${
                recognizedText ? '' : 'text-textSecondary'
              }`}
            >
              {recognizedText || 'Your recognized text will appear here in read‑only mode.'}
            </Text>
          </ScrollView>
        </View>

        <View className="h-[56] bg-surface border border-surfaceMuted rounded-3xl flex-row items-center justify-center">
          <Text className="text-[11px] text-textSecondary">
            System navigation area · keeps OS buttons clearly visible
          </Text>
        </View>
      </View>

      {/* Text input modal */}
      <Modal transparent visible={showTextModal} animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="w-full bg-surface rounded-3xl p-5">
            <Text className="text-base font-semibold text-textPrimary mb-2">Type your content</Text>
            <Text className="text-xs text-textSecondary mb-3">
              Manual text input will be displayed as read‑only after you confirm.
            </Text>
            <View className="rounded-2xl bg-surfaceMuted px-3 py-2 mb-4">
              <TextInput
                value={textDraft}
                onChangeText={setTextDraft}
                placeholder="Start typing here..."
                placeholderTextColor="#94A3B8"
                multiline
                className="text-sm text-textPrimary min-h-[96]"
              />
            </View>
            <View className="flex-row justify-end gap-3">
              <Pressable
                onPress={handleCancelText}
                className="px-4 py-2 rounded-full bg-surfaceMuted"
              >
                <Text className="text-xs font-semibold text-textSecondary">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmText}
                className="px-5 py-2 rounded-full bg-primary"
              >
                <Text className="text-xs font-semibold text-white">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voice capture modal */}
      <Modal transparent visible={showVoiceModal} animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="w-full bg-surface rounded-3xl p-5">
            <Text className="text-base font-semibold text-textPrimary mb-2">Speak to capture</Text>
            <Text className="text-xs text-textSecondary mb-4">
              Your voice will be converted to text and displayed in the read‑only area below.
            </Text>
            <View className="items-center justify-center mb-4">
              <View
                className={`w-24 h-24 rounded-full items-center justify-center ${
                  isListening ? 'bg-accent/20' : 'bg-surfaceMuted'
                }`}
              >
                <View
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    isListening ? 'bg-accent' : 'bg-primary'
                  }`}
                >
                  <Text className="text-white font-semibold text-xs">
                    {isListening ? 'Listening' : 'Tap to start'}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row justify-end gap-3">
              <Pressable
                onPress={stopListening}
                className="px-4 py-2 rounded-full bg-surfaceMuted"
              >
                <Text className="text-xs font-semibold text-textSecondary">
                  {isListening ? 'Stop' : 'Close'}
                </Text>
              </Pressable>
              {!isListening && (
                <Pressable
                  onPress={startListening}
                  className="px-5 py-2 rounded-full bg-primary"
                >
                  <Text className="text-xs font-semibold text-white">Start</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
