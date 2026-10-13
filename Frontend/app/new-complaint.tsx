import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { getErrorMessage } from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { LocationPicker } from '@/components/LocationPicker';
import { Button, Input } from '@/components/ThemedComponents';
import { pickImage, takePhoto, uploadImages } from '@/utils/imageUpload';
import {
  pickedLocationFromUserAddress,
  toApiLocation,
  type PickedLocation,
} from '@/utils/location';

const CATEGORIES = [
  { id: 'Infrastructure', label: 'Infrastructure', icon: 'layers' as const },
  { id: 'Utilities', label: 'Utilities', icon: 'zap' as const },
  { id: 'Sanitation', label: 'Sanitation', icon: 'trash-2' as const },
  { id: 'Security', label: 'Security', icon: 'shield' as const },
  { id: 'Parks', label: 'Parks', icon: 'feather' as const },
  { id: 'Other', label: 'Other', icon: 'more-horizontal' as const },
];

const MAX_IMAGES = 4;

export default function NewComplaintScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createComplaint } = useData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState<PickedLocation | null>(() =>
    pickedLocationFromUserAddress(user?.address ?? null),
  );
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    ImagePicker.getCameraPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        ImagePicker.requestCameraPermissionsAsync();
      }
    });
  }, []);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!category) e.category = 'Please select a category';
    return e;
  }

  async function handlePickImages() {
    try {
      const uris = await pickImage({
        allowsMultiple: true,
        selectionLimit: MAX_IMAGES - images.length,
      });
      if (uris.length) {
        setImages((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch (err) {
      Alert.alert('Permission Required', getErrorMessage(err));
    }
  }

  async function handleTakePhoto() {
    try {
      const uri = await takePhoto();
      if (uri) {
        setImages((prev) => [...prev, uri].slice(0, MAX_IMAGES));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch (err) {
      Alert.alert('Permission Required', getErrorMessage(err));
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    setSubmitError('');
    try {
      let uploadedImages: string[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadImages(images);
      }

      await createComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        images: uploadedImages,
        location: location ? toApiLocation(location) : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Failed to submit complaint.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.navy,
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name='arrow-left' size={20} color='#FFFFFF' />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>New Complaint</Text>
          <Text style={styles.headerSubtitle}>Report a community issue</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          padding: 20,
          paddingBottom: bottomInset + 24,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {submitError ? (
          <View
            style={{
              backgroundColor: colors.destructive + '18',
              borderRadius: colors.radius,
              padding: 12,
            }}
          >
            <Text
              style={{
                color: colors.destructive,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {submitError}
            </Text>
          </View>
        ) : null}

        <Input
          label='Complaint Title *'
          value={title}
          onChangeText={setTitle}
          placeholder='Brief title for the issue'
          error={errors.title}
          leftIcon={
            <Feather name='edit-2' size={16} color={colors.mutedForeground} />
          }
        />

        {/* Category */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: errors.category
                ? colors.destructive
                : colors.mutedForeground,
              fontFamily: 'Inter_500Medium',
            }}
          >
            Category *
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor:
                      category === cat.id ? colors.primary + '15' : colors.card,
                    borderColor:
                      category === cat.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={cat.icon}
                  size={20}
                  color={
                    category === cat.id
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_500Medium',
                    color:
                      category === cat.id ? colors.primary : colors.foreground,
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category ? (
            <Text
              style={{
                fontSize: 12,
                color: colors.destructive,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {errors.category}
            </Text>
          ) : null}
        </View>

        {/* Description */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: errors.description
                ? colors.destructive
                : colors.mutedForeground,
              fontFamily: 'Inter_500Medium',
            }}
          >
            Description *
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              borderWidth: 1.5,
              borderColor: errors.description
                ? colors.destructive
                : colors.border,
              padding: 14,
            }}
          >
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder='Describe the issue in detail...'
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical='top'
              style={{
                fontSize: 15,
                color: colors.foreground,
                fontFamily: 'Inter_400Regular',
                minHeight: 100,
              }}
            />
          </View>
          {errors.description ? (
            <Text
              style={{
                fontSize: 12,
                color: colors.destructive,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {errors.description}
            </Text>
          ) : null}
        </View>

        {/* Photo Upload */}
        <View style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: colors.mutedForeground,
                fontFamily: 'Inter_500Medium',
              }}
            >
              Attach Photos ({images.length}/{MAX_IMAGES})
            </Text>
            {images.length < MAX_IMAGES && (
              <Text
                style={{
                  fontSize: 11,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                Optional
              </Text>
            )}
          </View>

          {/* Image grid */}
          {images.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageThumb}>
                  <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%', borderRadius: 10 }}
                    contentFit='cover'
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={[
                      styles.removeBtn,
                      { backgroundColor: colors.destructive },
                    ]}
                  >
                    <Feather name='x' size={12} color='#FFF' />
                  </TouchableOpacity>
                </View>
              ))}
              {/* Add more placeholder */}
              {images.length < MAX_IMAGES && (
                <TouchableOpacity
                  onPress={handlePickImages}
                  style={[
                    styles.imageThumb,
                    styles.addImageBtn,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather
                    name='plus'
                    size={24}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.mutedForeground,
                      fontFamily: 'Inter_400Regular',
                      marginTop: 4,
                    }}
                  >
                    Add More
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Upload buttons */}
          {images.length === 0 && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={[
                  styles.uploadBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Feather name='camera' size={20} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Inter_500Medium',
                    color: colors.primary,
                    marginTop: 6,
                  }}
                >
                  Camera
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickImages}
                style={[
                  styles.uploadBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    flex: 2,
                  },
                ]}
              >
                <Feather name='image' size={20} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Inter_500Medium',
                    color: colors.primary,
                    marginTop: 6,
                  }}
                >
                  Choose from Gallery
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Inter_400Regular',
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                >
                  Up to {MAX_IMAGES} photos
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {images.length > 0 && images.length < MAX_IMAGES && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={[
                  styles.smallUploadBtn,
                  {
                    backgroundColor: colors.primary + '12',
                    borderColor: colors.primary + '30',
                  },
                ]}
              >
                <Feather name='camera' size={14} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_500Medium',
                    color: colors.primary,
                  }}
                >
                  Camera
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickImages}
                style={[
                  styles.smallUploadBtn,
                  {
                    backgroundColor: colors.primary + '12',
                    borderColor: colors.primary + '30',
                  },
                ]}
              >
                <Feather name='image' size={14} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_500Medium',
                    color: colors.primary,
                  }}
                >
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <LocationPicker
          label='Location'
          value={location}
          onChange={setLocation}
          placeholder='Pick where the issue is located'
        />

        <Button
          title='Submit Complaint'
          onPress={handleSubmit}
          loading={loading}
          size='lg'
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '30%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    flexGrow: 1,
    minWidth: 90,
    maxWidth: 120,
  },
  imageThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  addImageBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  smallUploadBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
