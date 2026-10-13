import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/axios';
import { updateUser } from '@/api/users';
import { updateWorkerProfile } from '@/api/workers';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ThemedComponents';
import { pickImage, takePhoto, uploadToCloudinary } from '@/utils/imageUpload';
import {
  mapUser,
  mapServiceTypeToApi,
  mapServiceTypeToUi,
} from '@/utils/mappers';

// Same category set used in service-request.tsx, so the values a worker
// selects here line up with the categories residents pick when posting a
// request.
const CATEGORIES = [
  { id: 'electrical', label: 'Electrical', icon: 'zap' as const },
  { id: 'plumbing', label: 'Plumbing', icon: 'droplet' as const },
  { id: 'carpentry', label: 'Carpentry', icon: 'tool' as const },
  { id: 'ac_repair', label: 'AC Repair', icon: 'wind' as const },
  { id: 'painting', label: 'Painting', icon: 'edit-2' as const },
  { id: 'pest_control', label: 'Pest Control', icon: 'shield' as const },
];

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser: setUser } = useAuth();

  const isWorker = user?.role === 'worker';

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  
  const [area, setArea] = useState(user?.address?.area ?? '');
  const [city, setCity] = useState(user?.address?.city ?? '');


  const [experience, setExperience] = useState(
    user?.workerProfile?.experience != null
      ? String(user.workerProfile.experience)
      : '',
  );
  
  const [cnicFront, setCnicFront] = useState<string | null>(user?.workerProfile?.cnicFront ?? null);
  const [cnicBack, setCnicBack] = useState<string | null>(user?.workerProfile?.cnicBack ?? null);
  const [imagePickerTarget, setImagePickerTarget] = useState<'front' | 'back' | 'avatar' | null>(null);

  const [skills, setSkills] = useState<string[]>(() =>
    (user?.workerProfile?.skills ?? []).map(mapServiceTypeToUi),
  );

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? '');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  function toggleSkill(id: string) {
    setSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleChangePhoto() {
    try {
      setPhotoUploaded(false);
      const uris = await pickImage({ allowsEditing: true, aspect: [1, 1] });
      if (!uris[0]) return;
      setUploadingPhoto(true);
      const url = await uploadToCloudinary(uris[0]);
      setAvatarUrl(url);
      setPhotoUploaded(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !user) return;
    setLoading(true);
    setError('');
    try {
      const addressPayload =
        area.trim() || city.trim()
          ? {
              area: area.trim() || undefined,
              city: city.trim() || undefined,
              street: user.address?.street,
            }
          : user.address;

      let latestApiUser = await updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        profileImage: avatarUrl || undefined,
        address: addressPayload,
      });

      if (isWorker) {
        let frontUrl = cnicFront;
        let backUrl = cnicBack;
        
        if (cnicFront && cnicFront.startsWith('file://')) {
           frontUrl = await uploadToCloudinary(cnicFront);
        }
        if (cnicBack && cnicBack.startsWith('file://')) {
           backUrl = await uploadToCloudinary(cnicBack);
        }

        latestApiUser = await updateWorkerProfile({
          bio: bio.trim() || undefined,
          experience: experience.trim() ? parseInt(experience, 10) : undefined,
          skills: skills.length ? skills.map(mapServiceTypeToApi) : undefined,
          cnicFront: frontUrl || undefined,
          cnicBack: backUrl || undefined,
        });
      }

      setUser(mapUser(latestApiUser));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile.'));
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text
            style={{
              fontSize: 15,
              color: colors.accent,
              fontFamily: 'Inter_600SemiBold',
            }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
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
        {/* Avatar */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: colors.accent },
              ]}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  contentFit='cover'
                />
              ) : (
                <Text
                  style={{
                    fontSize: 40,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    fontFamily: 'Inter_700Bold',
                  }}
                >
                  {(name || user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
              <View
                style={[
                  styles.cameraOverlay,
                  { backgroundColor: 'rgba(0,0,0,0.45)' },
                ]}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color='#FFFFFF' size='small' />
                ) : (
                  <Feather name='camera' size={22} color='#FFFFFF' />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {uploadingPhoto && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 10,
              }}
            >
              <ActivityIndicator size='small' color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                Uploading photo...
              </Text>
            </View>
          )}
          {photoUploaded && !uploadingPhoto && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 10,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.success ?? '#22c55e',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name='check' size={13} color='#FFFFFF' />
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.success ?? '#22c55e',
                  fontFamily: 'Inter_500Medium',
                }}
              >
                Photo uploaded successfully
              </Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
              marginTop: 6,
            }}
          >
            Tap photo to change
          </Text>
        </View>

        {error ? (
          <View
            style={{
              backgroundColor: colors.destructive + '18',
              borderRadius: 12,
              padding: 12,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <Feather name='alert-circle' size={16} color={colors.destructive} />
            <Text
              style={{
                flex: 1,
                color: colors.destructive,
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        <Input
          label='Full Name *'
          value={name}
          onChangeText={setName}
          placeholder='Your full name'
          leftIcon={
            <Feather name='user' size={16} color={colors.mutedForeground} />
          }
        />

        {/* Email — read only */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.mutedForeground,
              fontFamily: 'Inter_500Medium',
            }}
          >
            Email (cannot be changed)
          </Text>
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Feather name='mail' size={16} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: 15,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {user?.email}
            </Text>
          </View>
        </View>

        <Input
          label='Phone Number'
          value={phone}
          onChangeText={setPhone}
          placeholder='+92 300 0000000'
          keyboardType='phone-pad'
          leftIcon={
            <Feather name='phone' size={16} color={colors.mutedForeground} />
          }
        />

        <Input
          label='Area / Neighbourhood'
          value={area}
          onChangeText={setArea}
          placeholder='e.g. DHA Phase 5'
          leftIcon={
            <Feather name='map-pin' size={16} color={colors.mutedForeground} />
          }
        />

        <Input
          label='City'
          value={city}
          onChangeText={setCity}
          placeholder='e.g. Lahore'
          leftIcon={
            <Feather name='map-pin' size={16} color={colors.mutedForeground} />
          }
        />

        <Input
          label='Bio'
          value={bio}
          onChangeText={setBio}
          placeholder='Tell us about yourself...'
          leftIcon={
            <Feather name='info' size={16} color={colors.mutedForeground} />
          }
        />

        {/* Worker-only fields */}
        {isWorker && (
          <>
            <Input
              label='Years of Experience'
              value={experience}
              onChangeText={(t) => setExperience(t.replace(/[^0-9]/g, ''))}
              placeholder='e.g. 5'
              keyboardType='numeric'
              leftIcon={
                <Feather
                  name='briefcase'
                  size={16}
                  color={colors.mutedForeground}
                />
              }
            />

            <View style={{ gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                CNIC Images (Optional)
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setImagePickerTarget('front')}
                  style={{
                    flex: 1,
                    height: 100,
                    borderRadius: colors.radius,
                    backgroundColor: cnicFront ? colors.card : colors.background,
                    borderWidth: 1.5,
                    borderStyle: cnicFront ? "solid" : "dashed",
                    borderColor: cnicFront ? colors.primary : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}
                >
                  {cnicFront ? (
                    <View style={{ width: "100%", height: "100%" }}>
                      <Image source={{ uri: cnicFront }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 4, alignItems: "center" }}>
                        <Text style={{ fontSize: 10, color: "#fff", fontFamily: "Inter_500Medium" }}>Front</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ alignItems: "center", gap: 6 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                        <Feather name="plus" size={16} color={colors.mutedForeground} />
                      </View>
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Front Side</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setImagePickerTarget('back')}
                  style={{
                    flex: 1,
                    height: 100,
                    borderRadius: colors.radius,
                    backgroundColor: cnicBack ? colors.card : colors.background,
                    borderWidth: 1.5,
                    borderStyle: cnicBack ? "solid" : "dashed",
                    borderColor: cnicBack ? colors.primary : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}
                >
                  {cnicBack ? (
                    <View style={{ width: "100%", height: "100%" }}>
                      <Image source={{ uri: cnicBack }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 4, alignItems: "center" }}>
                        <Text style={{ fontSize: 10, color: "#fff", fontFamily: "Inter_500Medium" }}>Back</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ alignItems: "center", gap: 6 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                        <Feather name="plus" size={16} color={colors.mutedForeground} />
                      </View>
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Back Side</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_500Medium',
                }}
              >
                Services You Offer
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const selected = skills.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => toggleSkill(cat.id)}
                      style={[
                        styles.catCard,
                        {
                          backgroundColor: selected
                            ? colors.primary + '15'
                            : colors.card,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Feather
                        name={cat.icon}
                        size={20}
                        color={
                          selected ? colors.primary : colors.mutedForeground
                        }
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Inter_500Medium',
                          color: selected ? colors.primary : colors.foreground,
                          marginTop: 6,
                          textAlign: 'center',
                        }}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        <Button
          title='Save Changes'
          onPress={handleSave}
          loading={loading}
          disabled={!name.trim() || uploadingPhoto}
          size='lg'
        />
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={!!imagePickerTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setImagePickerTarget(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          activeOpacity={1}
          onPress={() => setImagePickerTarget(null)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: bottomInset + 24,
            }}
          >
            <Text style={{ fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 20 }}>
              Upload Image
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                gap: 16
              }}
              onPress={async () => {
                const target = imagePickerTarget;
                setImagePickerTarget(null);
                try {
                  const uri = await takePhoto({ allowsEditing: true });
                  if (uri) {
                    if (target === 'front') setCnicFront(uri);
                    if (target === 'back') setCnicBack(uri);
                    if (target === 'avatar') setAvatarUrl(uri);
                  }
                } catch (err) {
                  setError(getErrorMessage(err, "Camera failed."));
                }
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name="camera" size={20} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontFamily: "Inter_500Medium", color: colors.foreground }}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                gap: 16
              }}
              onPress={async () => {
                const target = imagePickerTarget;
                setImagePickerTarget(null);
                try {
                  const uris = await pickImage({ allowsEditing: true });
                  if (uris && uris.length > 0) {
                    if (target === 'front') setCnicFront(uris[0]);
                    if (target === 'back') setCnicBack(uris[0]);
                    if (target === 'avatar') setAvatarUrl(uris[0]);
                  }
                } catch (err) {
                  setError(getErrorMessage(err, "Gallery failed."));
                }
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name="image" size={20} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 16, fontFamily: "Inter_500Medium", color: colors.foreground }}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    width: '30%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    flexGrow: 1,
    minWidth: 90,
    maxWidth: 120,
  },
});
