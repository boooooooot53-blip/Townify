import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function pickImage(options?: {
  allowsMultiple?: boolean;
  selectionLimit?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<string[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: options?.allowsMultiple ?? false,
    quality: 0.7,
    selectionLimit: options?.selectionLimit ?? 1,
    allowsEditing: options?.allowsEditing ?? false,
    aspect: options?.aspect,
    base64: true,
  });

  if (result.canceled) return [];
  return result.assets.map((asset) => `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
}

export async function takePhoto(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<string | null> {
  // Check first without requesting
  const { status: existingStatus } =
    await ImagePicker.getCameraPermissionsAsync();

  if (existingStatus !== 'granted') {
    // Only request if not already granted
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required');
    }
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
    allowsEditing: options?.allowsEditing ?? false,
    aspect: options?.aspect,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  return `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
}

export async function uploadToCloudinary(imageUri: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env',
    );
  }

  const formData = new FormData();
  // Cloudinary parses sequentially. Always send the preset before the large file payload.
  formData.append('upload_preset', UPLOAD_PRESET);
  // imageUri is a Base64 Data URI from our pickers, which Cloudinary accepts as-is as a string.
  formData.append('file', imageUri);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorBody}`);
  }

  const data = await response.json();
  return data.secure_url as string;
}

export async function uploadImages(imageUris: string[]): Promise<string[]> {
  const uploads = await Promise.all(
    imageUris.map((uri) => uploadToCloudinary(uri)),
  );
  return uploads;
}
