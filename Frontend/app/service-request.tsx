import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
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
import { mapServiceTypeToApi } from '@/utils/mappers';
import {
  pickedLocationFromUserAddress,
  toApiLocation,
  type PickedLocation,
} from '@/utils/location';

const CATEGORIES = [
  { id: 'electrical', label: 'Electrical', icon: 'zap' as const },
  { id: 'plumbing', label: 'Plumbing', icon: 'droplet' as const },
  { id: 'carpentry', label: 'Carpentry', icon: 'tool' as const },
  { id: 'ac_repair', label: 'AC Repair', icon: 'wind' as const },
  { id: 'painting', label: 'Painting', icon: 'edit-2' as const },
  { id: 'pest_control', label: 'Pest Control', icon: 'shield' as const },
];

const MAX_IMAGES = 4;

export default function ServiceRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { category: initialCategory } = useLocalSearchParams<{
    category: string;
  }>();
  const { user } = useAuth();
  const { createServiceRequest } = useData();

  const filteredCategories = React.useMemo(() => {
    if (user?.role === 'worker' && user?.profession) {
      return CATEGORIES.filter(
        (cat) => cat.id.toLowerCase() === user.profession?.toLowerCase()
      );
    }
    return CATEGORIES;
  }, [user]);

  const [category, setCategory] = useState(
    user?.role === 'worker' && user?.profession 
      ? user.profession 
      : (initialCategory ?? 'electrical')
  );
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<PickedLocation | null>(() =>
    pickedLocationFromUserAddress(user?.address ?? null),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isWorker = user?.role === 'worker';

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

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
    if (!description.trim()) return;

    setLoading(true);
    setError('');
    try {
      let uploadedImages: string[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadImages(images);
      }

      await createServiceRequest({
        title: `${category.replace('_', ' ')} service request`,
        description: description.trim(),
        serviceType: mapServiceTypeToApi(category),
        images: uploadedImages,
        location: location ? toApiLocation(location) : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.push('/(tabs)/services');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to post service request.'));
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
          <Text style={styles.headerTitle}>Service Request</Text>
          <Text style={styles.headerSubtitle}>
            Workers will send you quotations
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          padding: 24,
          paddingBottom: bottomInset + 32,
          gap: 24,
          maxWidth: 800,
          alignSelf: 'center',
          width: '100%',
        }}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
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
              {error}
            </Text>
          </View>
        ) : null}

        {/* Category */}
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.mutedForeground,
              fontFamily: 'Inter_500Medium',
            }}
          >
            Service Category
          </Text>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[
                  styles.catCard,
                  {
                    backgroundColor:
                      category === cat.id ? colors.secondary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather
                  name={cat.icon}
                  size={24}
                  color={
                    category === cat.id
                      ? colors.foreground
                      : colors.mutedForeground
                  }
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_700Bold',
                    fontWeight: 'bold',
                    color:
                      category === cat.id ? colors.foreground : colors.mutedForeground,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.mutedForeground,
              fontFamily: 'Inter_500Medium',
            }}
          >
            {isWorker ? 'Write about job post *' : 'Describe the Issue *'}
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={isWorker ? 'Write about the job post...' : 'Describe what needs to be done...'}
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
        </View>

        <LocationPicker
          label='Service Location'
          value={location}
          onChange={setLocation}
          placeholder='Where should the worker come?'
        />

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

        {/* Info Box */}
        <View
          style={{
            backgroundColor: colors.info + '12',
            borderRadius: colors.radius,
            padding: 14,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <Feather
            name='info'
            size={16}
            color={colors.info}
            style={{ marginTop: 1 }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: colors.info,
              fontFamily: 'Inter_400Regular',
              lineHeight: 20,
            }}
          >
            Once submitted, available workers will send quotations. Compare
            their prices and ratings before accepting.
          </Text>
        </View>

        <Button
          title='Post Request'
          onPress={handleSubmit}
          loading={loading}
          disabled={!description.trim()}
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catCard: {
    flexBasis: 100,
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 3,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
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
