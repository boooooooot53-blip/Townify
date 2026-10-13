import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useData, MenuItem } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  pickImage as pickImageUtil,
  uploadToCloudinary,
  uploadImages,
} from '@/utils/imageUpload';

// ─────────────────────────────────────────────────────────────────────────────
// Shared types / constants
// ─────────────────────────────────────────────────────────────────────────────

const MENU_CATEGORIES = [
  'appetizer',
  'main',
  'dessert',
  'beverage',
  'side',
  'special',
] as const;

const SPICE_LEVELS = ['mild', 'medium', 'hot', 'extra_hot'] as const;

const CUISINE_OPTIONS = [
  'Pakistani',
  'Chinese',
  'Fast Food',
  'BBQ',
  'Desi',
  'Italian',
  'Burgers',
  'Pizza',
  'Wraps',
  'Desserts',
  'Beverages',
  'Seafood',
];

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

const DAYS: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

function blankDay(): DayHours {
  return { open: '09:00', close: '22:00', isClosed: false };
}

function blankHours(): Record<DayKey, DayHours> {
  return Object.fromEntries(DAYS.map((d) => [d, blankDay()])) as Record<
    DayKey,
    DayHours
  >;
}

function normalizeHours(
  raw?: Record<string, Partial<DayHours>>,
): Record<DayKey, DayHours> {
  const base = blankHours();
  if (!raw) return base;
  for (const day of DAYS) {
    const h = raw[day];
    if (h) {
      base[day] = {
        open: h.open ?? '09:00',
        close: h.close ?? '22:00',
        isClosed: !!h.isClosed,
      };
    }
  }
  return base;
}

interface MenuItemDraft {
  _key: string;
  id?: string;
  name: string;
  description: string;
  price: string;
  category: (typeof MENU_CATEGORIES)[number];
  isVegetarian: boolean;
  isAvailable: boolean;
  spiceLevel: (typeof SPICE_LEVELS)[number];
  image?: string;
}

function toDraft(item: MenuItem): MenuItemDraft {
  return {
    _key: item.id,
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    price: String(item.price),
    category: (MENU_CATEGORIES as readonly string[]).includes(item.category)
      ? (item.category as MenuItemDraft['category'])
      : 'main',
    isVegetarian: !!item.isVegetarian,
    isAvailable: item.isAvailable ?? true,
    spiceLevel: item.spiceLevel ?? 'mild',
    image: item.image,
  };
}

function blankMenuDraft(): MenuItemDraft {
  return {
    _key: `new-${Date.now()}`,
    name: '',
    description: '',
    price: '',
    category: 'main',
    isVegetarian: false,
    isAvailable: true,
    spiceLevel: 'mild',
  };
}

function validateMenuDraft(draft: MenuItemDraft): string | null {
  if (!draft.name.trim()) return 'Item name is required.';
  if (
    !draft.price.trim() ||
    isNaN(Number(draft.price)) ||
    Number(draft.price) < 0
  ) {
    return 'Enter a valid price.';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ImagePickerTile — square tile used in the multi-image grid
// ─────────────────────────────────────────────────────────────────────────────

function ImagePickerTile({
  uri,
  uploading,
  onPick,
  onRemove,
  size = 90,
  colors,
}: {
  uri: string | null;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
  size?: number;
  colors: ReturnType<typeof useColors>;
}) {
  if (uploading) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          backgroundColor: colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size='small' color={colors.primary} />
      </View>
    );
  }
  if (uri) {
    return (
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: 10,
            backgroundColor: colors.muted,
          }}
          resizeMode='cover'
        />
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.destructive,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name='x' size={12} color='#FFF' />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPick}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: colors.primary + '50',
        backgroundColor: colors.primary + '08',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <Feather name='camera' size={22} color={colors.primary} />
      <Text
        style={{
          fontSize: 11,
          color: colors.primary,
          fontFamily: 'Inter_400Regular',
          textAlign: 'center',
        }}
      >
        Add photo
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ImagePickerField — single image picker (used for menu item photos)
// ─────────────────────────────────────────────────────────────────────────────

function ImagePickerField({
  label,
  hint,
  image,
  onPick,
  onRemove,
  uploadFn,
  colors,
  aspectRatio,
}: {
  label: string;
  hint?: string;
  image?: string;
  onPick: (uri: string) => void;
  onRemove: () => void;
  uploadFn?: (uri: string) => Promise<string>;
  colors: ReturnType<typeof useColors>;
  aspectRatio?: number;
}) {
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isLoading = picking || uploading;

  async function handlePick() {
    setPicking(true);
    try {
      const uris = await pickImageUtil({ allowsEditing: true });
      if (!uris.length) return;
      const uri = uris[0];
      if (uploadFn) {
        setPicking(false);
        setUploading(true);
        try {
          const url = await uploadFn(uri);
          onPick(url);
        } catch (e: any) {
          Alert.alert('Upload failed', e?.message ?? 'Could not upload image.');
        } finally {
          setUploading(false);
        }
      } else {
        onPick(uri);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not pick image.');
    } finally {
      setPicking(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.foreground,
          fontFamily: 'Inter_600SemiBold',
        }}
      >
        {label}
      </Text>
      {image ? (
        <View style={{ gap: 8 }}>
          <Image
            source={{ uri: image }}
            style={{
              width: '100%',
              aspectRatio: aspectRatio ?? 4 / 3,
              borderRadius: 10,
              backgroundColor: colors.border,
            }}
            resizeMode='cover'
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handlePick}
              disabled={isLoading}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingVertical: 10,
                backgroundColor: colors.card,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size='small' color={colors.primary} />
              ) : (
                <>
                  <Feather name='image' size={15} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.primary,
                      fontFamily: 'Inter_600SemiBold',
                    }}
                  >
                    Change photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRemove}
              disabled={isLoading}
              style={{
                width: 42,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.destructive + '40',
                borderRadius: 10,
                backgroundColor: colors.destructive + '08',
              }}
            >
              <Feather name='trash-2' size={15} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handlePick}
          disabled={isLoading}
          style={{
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: colors.border,
            borderRadius: 10,
            paddingVertical: 28,
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.card,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Feather name='camera' size={22} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                Tap to add a photo
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {hint ? (
        <Text
          style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small shared inputs
// ─────────────────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  colors,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  hint?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.foreground,
          fontFamily: 'Inter_600SemiBold',
        }}
      >
        {label}
      </Text>
      {children}
      {hint ? (
        <Text
          style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  colors,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={keyboardType ?? 'default'}
      multiline={multiline}
      numberOfLines={numberOfLines}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 15,
        color: colors.foreground,
        fontFamily: 'Inter_400Regular',
        backgroundColor: colors.background,
        minHeight: multiline ? 70 : undefined,
        textAlignVertical: multiline ? 'top' : 'center',
      }}
    />
  );
}

function Chip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary + '15' : colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 12.5,
          fontWeight: selected ? '600' : '400',
          color: selected ? colors.primary : colors.mutedForeground,
          fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Details tab — edit the restaurant's own fields
// ─────────────────────────────────────────────────────────────────────────────

function DetailsTab({
  images,
  setImages,
  bannerUploading,
  setBannerUploading,
  name,
  setName,
  description,
  setDescription,
  phone,
  setPhone,
  address,
  setAddress,
  city,
  setCity,
  area,
  setArea,
  cuisine,
  setCuisine,
  hours,
  setHours,
  deliveryAvailable,
  setDeliveryAvailable,
  minimumOrder,
  setMinimumOrder,
  onSave,
  saving,
  onDeactivate,
  deactivating,
  colors,
}: {
  images: string[];
  setImages: (v: string[]) => void;
  bannerUploading: boolean;
  setBannerUploading: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  cuisine: string[];
  setCuisine: (v: string[]) => void;
  hours: Record<DayKey, DayHours>;
  setHours: (v: Record<DayKey, DayHours>) => void;
  deliveryAvailable: boolean;
  setDeliveryAvailable: (v: boolean) => void;
  minimumOrder: string;
  setMinimumOrder: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  onDeactivate: () => void;
  deactivating: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  function toggleCuisine(c: string) {
    setCuisine(
      cuisine.includes(c) ? cuisine.filter((x) => x !== c) : [...cuisine, c],
    );
  }

  function updateDay(day: DayKey, patch: Partial<DayHours>) {
    setHours({ ...hours, [day]: { ...hours[day], ...patch } });
  }

  async function handlePickBanners() {
    try {
      const uris = await pickImageUtil({
        allowsMultiple: true,
        selectionLimit: 4 - images.length,
      });
      if (!uris.length) return;
      setBannerUploading(true);
      const urls = await uploadImages(uris);
      setImages([...images, ...urls].slice(0, 4));
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Could not upload images.');
    } finally {
      setBannerUploading(false);
    }
  }

  return (
    <View style={{ gap: 20 }}>
      {/* ── Restaurant photos ── */}
      <Field
        label='Restaurant photos'
        colors={colors}
        hint='Up to 4 photos. First photo is used as the main banner.'
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 4,
          }}
        >
          {images.map((url) => (
            <ImagePickerTile
              key={url}
              uri={url}
              uploading={false}
              onPick={() => {}}
              onRemove={() => setImages(images.filter((u) => u !== url))}
              size={90}
              colors={colors}
            />
          ))}
          {images.length < 4 && (
            <ImagePickerTile
              uri={null}
              uploading={bannerUploading}
              onPick={handlePickBanners}
              onRemove={() => {}}
              size={90}
              colors={colors}
            />
          )}
        </View>
      </Field>

      <Field label='Restaurant name *' colors={colors}>
        <StyledInput
          value={name}
          onChangeText={setName}
          placeholder='e.g. Lahori Darbar'
          colors={colors}
        />
      </Field>

      <Field label='Description' colors={colors}>
        <StyledInput
          value={description}
          onChangeText={setDescription}
          placeholder='Tell customers what makes your place special'
          multiline
          numberOfLines={3}
          colors={colors}
        />
      </Field>

      <Field label='Contact phone' colors={colors}>
        <StyledInput
          value={phone}
          onChangeText={setPhone}
          placeholder='03XX-XXXXXXX'
          keyboardType='phone-pad'
          colors={colors}
        />
      </Field>

      <Field label='Street address *' colors={colors}>
        <StyledInput
          value={address}
          onChangeText={setAddress}
          placeholder='e.g. 12 Main Boulevard'
          colors={colors}
        />
      </Field>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label='City' colors={colors}>
            <StyledInput
              value={city}
              onChangeText={setCity}
              placeholder='Lahore'
              colors={colors}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label='Area' colors={colors}>
            <StyledInput
              value={area}
              onChangeText={setArea}
              placeholder='DHA, Gulberg…'
              colors={colors}
            />
          </Field>
        </View>
      </View>

      <Field label='Cuisine types' colors={colors} hint='Select all that apply'>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CUISINE_OPTIONS.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={cuisine.includes(c)}
              onPress={() => toggleCuisine(c)}
              colors={colors}
            />
          ))}
        </View>
      </Field>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
          backgroundColor: colors.card,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.foreground,
              fontFamily: 'Inter_600SemiBold',
            }}
          >
            Delivery available
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Customers can order for home delivery
          </Text>
        </View>
        <Switch
          value={deliveryAvailable}
          onValueChange={setDeliveryAvailable}
          trackColor={{ false: colors.border, true: colors.primary + '80' }}
          thumbColor={
            deliveryAvailable ? colors.primary : colors.mutedForeground
          }
        />
      </View>

      {deliveryAvailable && (
        <Field
          label='Minimum order (Rs.)'
          colors={colors}
          hint='Leave 0 for no minimum'
        >
          <StyledInput
            value={minimumOrder}
            onChangeText={setMinimumOrder}
            placeholder='200'
            keyboardType='numeric'
            colors={colors}
          />
        </Field>
      )}

      <Field label='Opening hours' colors={colors}>
        <View style={{ gap: 10 }}>
          {DAYS.map((day) => {
            const h = hours[day];
            return (
              <View
                key={day}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                  backgroundColor: colors.card,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.foreground,
                      fontFamily: 'Inter_600SemiBold',
                      textTransform: 'capitalize',
                    }}
                  >
                    {day}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.mutedForeground,
                        fontFamily: 'Inter_400Regular',
                      }}
                    >
                      {h.isClosed ? 'Closed' : 'Open'}
                    </Text>
                    <Switch
                      value={!h.isClosed}
                      onValueChange={(v) => updateDay(day, { isClosed: !v })}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary + '80',
                      }}
                      thumbColor={
                        !h.isClosed ? colors.primary : colors.mutedForeground
                      }
                    />
                  </View>
                </View>
                {!h.isClosed && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                          fontFamily: 'Inter_400Regular',
                          marginBottom: 4,
                        }}
                      >
                        Opens
                      </Text>
                      <TextInput
                        value={h.open}
                        onChangeText={(t) => updateDay(day, { open: t })}
                        placeholder='09:00'
                        placeholderTextColor={colors.mutedForeground}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          fontSize: 14,
                          color: colors.foreground,
                          fontFamily: 'Inter_400Regular',
                          backgroundColor: colors.background,
                          textAlign: 'center',
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                          fontFamily: 'Inter_400Regular',
                          marginBottom: 4,
                        }}
                      >
                        Closes
                      </Text>
                      <TextInput
                        value={h.close}
                        onChangeText={(t) => updateDay(day, { close: t })}
                        placeholder='22:00'
                        placeholderTextColor={colors.mutedForeground}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          fontSize: 14,
                          color: colors.foreground,
                          fontFamily: 'Inter_400Regular',
                          backgroundColor: colors.background,
                          textAlign: 'center',
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Field>

      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        style={{
          borderRadius: 12,
          paddingVertical: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: saving ? colors.primary + '60' : colors.primary,
        }}
      >
        {saving ? (
          <ActivityIndicator color='#FFF' />
        ) : (
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#FFFFFF',
              fontFamily: 'Inter_700Bold',
            }}
          >
            Save changes
          </Text>
        )}
      </TouchableOpacity>

      {/* Danger zone */}
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.destructive + '30',
          backgroundColor: colors.destructive + '08',
          borderRadius: 12,
          padding: 16,
          gap: 10,
          marginTop: 8,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: colors.destructive,
            fontFamily: 'Inter_700Bold',
          }}
        >
          Delete restaurant
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
            lineHeight: 18,
          }}
        >
          Permanently deletes this restaurant and all its data from the
          database. This action cannot be undone.
        </Text>
        <TouchableOpacity
          onPress={onDeactivate}
          disabled={deactivating}
          style={{
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: deactivating
              ? colors.destructive + '60'
              : colors.destructive,
          }}
        >
          {deactivating ? (
            <ActivityIndicator color='#FFF' size='small' />
          ) : (
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: '#FFFFFF',
                fontFamily: 'Inter_700Bold',
              }}
            >
              Delete restaurant permanently
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// One menu item card — collapsed summary, expands into a full edit form
// ─────────────────────────────────────────────────────────────────────────────

function MenuItemEditor({
  draft,
  isNew,
  isExpanded,
  onToggle,
  onChange,
  onSave,
  onRemove,
  saving,
  removing,
  colors,
}: {
  draft: MenuItemDraft;
  isNew: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<MenuItemDraft>) => void;
  onSave: () => void;
  onRemove: () => void;
  saving: boolean;
  removing: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const hasName = draft.name.trim().length > 0;

  return (
    <View
      style={[
        styles.itemCard,
        {
          borderColor: isExpanded ? colors.primary + '60' : colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <TouchableOpacity onPress={onToggle} style={styles.itemHeader}>
        {draft.image && !isExpanded ? (
          <Image
            source={{ uri: draft.image }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: colors.border,
            }}
            resizeMode='cover'
          />
        ) : null}

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: hasName ? colors.foreground : colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
              }}
            >
              {hasName ? draft.name : 'Untitled item'}
            </Text>
            {!draft.isAvailable && (
              <View
                style={[
                  styles.unavailableBadge,
                  { backgroundColor: colors.mutedForeground + '20' },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_600SemiBold',
                  }}
                >
                  Unavailable
                </Text>
              </View>
            )}
          </View>
          {hasName && (
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
                marginTop: 2,
              }}
            >
              {draft.category} · Rs. {draft.price || '0'}
            </Text>
          )}
        </View>

        {removing ? (
          <ActivityIndicator size='small' color={colors.destructive} />
        ) : (
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name='trash-2' size={16} color={colors.destructive} />
          </TouchableOpacity>
        )}

        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.itemBody}>
          {/* ── Item photo ── */}
          <ImagePickerField
            label='Item photo'
            hint='Appears on the menu card (optional)'
            image={draft.image}
            onPick={(url) => onChange({ image: url })}
            onRemove={() => onChange({ image: undefined })}
            uploadFn={uploadToCloudinary}
            colors={colors}
            aspectRatio={4 / 3}
          />

          <Field label='Item name *' colors={colors}>
            <StyledInput
              value={draft.name}
              onChangeText={(v) => onChange({ name: v })}
              placeholder='e.g. Chicken Karahi'
              colors={colors}
            />
          </Field>

          <Field label='Description' colors={colors}>
            <StyledInput
              value={draft.description}
              onChangeText={(v) => onChange({ description: v })}
              placeholder='Short description'
              multiline
              numberOfLines={2}
              colors={colors}
            />
          </Field>

          <Field label='Price (Rs.) *' colors={colors}>
            <StyledInput
              value={draft.price}
              onChangeText={(v) => onChange({ price: v })}
              placeholder='350'
              keyboardType='numeric'
              colors={colors}
            />
          </Field>

          <Field label='Category' colors={colors}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {MENU_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={draft.category === cat}
                  onPress={() => onChange({ category: cat })}
                  colors={colors}
                />
              ))}
            </View>
          </Field>

          <Field label='Spice level' colors={colors}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {SPICE_LEVELS.map((level) => (
                <Chip
                  key={level}
                  label={level.replace('_', ' ')}
                  selected={draft.spiceLevel === level}
                  onPress={() => onChange({ spiceLevel: level })}
                  colors={colors}
                />
              ))}
            </View>
          </Field>

          <View style={styles.switchRow}>
            <Text
              style={{
                fontSize: 14,
                color: colors.foreground,
                fontFamily: 'Inter_400Regular',
              }}
            >
              Vegetarian
            </Text>
            <Switch
              value={draft.isVegetarian}
              onValueChange={(v) => onChange({ isVegetarian: v })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={
                draft.isVegetarian ? colors.primary : colors.mutedForeground
              }
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.foreground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                Available to order
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                  marginTop: 1,
                }}
              >
                Turn off to temporarily hide this item without deleting it
              </Text>
            </View>
            <Switch
              value={draft.isAvailable}
              onValueChange={(v) => onChange({ isAvailable: v })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={
                draft.isAvailable ? colors.primary : colors.mutedForeground
              }
            />
          </View>

          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[
              styles.saveBtn,
              {
                backgroundColor: saving
                  ? colors.primary + '60'
                  : colors.primary,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator color='#FFF' size='small' />
            ) : (
              <Text style={styles.saveBtnText}>
                {isNew ? 'Add item' : 'Save changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu tab
// ─────────────────────────────────────────────────────────────────────────────

function MenuTab({
  existingDrafts,
  newDrafts,
  expandedKey,
  setExpandedKey,
  updateExisting,
  updateNew,
  saveExisting,
  saveNew,
  confirmDeleteExisting,
  discardNewItem,
  addNewItem,
  savingKey,
  removingId,
  colors,
}: {
  existingDrafts: MenuItemDraft[];
  newDrafts: MenuItemDraft[];
  expandedKey: string | null;
  setExpandedKey: (k: string | null) => void;
  updateExisting: (key: string, patch: Partial<MenuItemDraft>) => void;
  updateNew: (key: string, patch: Partial<MenuItemDraft>) => void;
  saveExisting: (draft: MenuItemDraft) => void;
  saveNew: (draft: MenuItemDraft) => void;
  confirmDeleteExisting: (draft: MenuItemDraft) => void;
  discardNewItem: (key: string) => void;
  addNewItem: () => void;
  savingKey: string | null;
  removingId: string | null;
  colors: ReturnType<typeof useColors>;
}) {
  const totalItems = existingDrafts.length + newDrafts.length;

  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontSize: 13,
          color: colors.mutedForeground,
          fontFamily: 'Inter_400Regular',
        }}
      >
        {totalItems} item{totalItems === 1 ? '' : 's'} on your menu
      </Text>

      {totalItems === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
          <Feather name='coffee' size={32} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
              textAlign: 'center',
            }}
          >
            No menu items yet — add your first one below.
          </Text>
        </View>
      )}

      {existingDrafts.map((draft) => (
        <MenuItemEditor
          key={draft._key}
          draft={draft}
          isNew={false}
          isExpanded={expandedKey === draft._key}
          onToggle={() =>
            setExpandedKey(expandedKey === draft._key ? null : draft._key)
          }
          onChange={(patch) => updateExisting(draft._key, patch)}
          onSave={() => saveExisting(draft)}
          onRemove={() => confirmDeleteExisting(draft)}
          saving={savingKey === draft._key}
          removing={removingId === draft.id}
          colors={colors}
        />
      ))}

      {newDrafts.map((draft) => (
        <MenuItemEditor
          key={draft._key}
          draft={draft}
          isNew
          isExpanded={expandedKey === draft._key}
          onToggle={() =>
            setExpandedKey(expandedKey === draft._key ? null : draft._key)
          }
          onChange={(patch) => updateNew(draft._key, patch)}
          onSave={() => saveNew(draft)}
          onRemove={() => discardNewItem(draft._key)}
          saving={savingKey === draft._key}
          removing={false}
          colors={colors}
        />
      ))}

      <TouchableOpacity
        onPress={addNewItem}
        style={[
          styles.addItemBtn,
          {
            borderColor: colors.primary + '60',
            backgroundColor: colors.primary + '08',
          },
        ]}
      >
        <Feather name='plus' size={18} color={colors.primary} />
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
            fontFamily: 'Inter_600SemiBold',
          }}
        >
          Add menu item
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function ManageRestaurantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const {
    restaurants,
    fetchRestaurantById,
    updateRestaurant,
    deleteRestaurant,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'details' | 'menu'>('details');
  const [loading, setLoading] = useState(true);

  // Details tab state
  const [detailsInitialized, setDetailsInitialized] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [hours, setHours] = useState<Record<DayKey, DayHours>>(blankHours());
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [minimumOrder, setMinimumOrder] = useState('0');
  const [savingDetails, setSavingDetails] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Menu tab state
  const [existingDrafts, setExistingDrafts] = useState<MenuItemDraft[]>([]);
  const [newDrafts, setNewDrafts] = useState<MenuItemDraft[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchRestaurantById(restaurantId!);
      setLoading(false);
    })();
  }, [restaurantId, fetchRestaurantById]);

  const restaurant = restaurants.find((r) => r.id === restaurantId);

  useEffect(() => {
    if (restaurant && !detailsInitialized) {
      setImages(restaurant.images ?? []);
      setName(restaurant.name);
      setDescription(restaurant.description ?? '');
      setPhone(restaurant.contactPhone ?? '');
      setAddress(restaurant.location?.address ?? '');
      setCity(restaurant.location?.city ?? '');
      setArea(restaurant.location?.area ?? '');
      setCuisine(restaurant.cuisines ?? []);
      setDeliveryAvailable(!!restaurant.deliveryAvailable);
      setMinimumOrder(String(restaurant.minOrder ?? 0));
      setHours(normalizeHours(restaurant.openingHours));
      setDetailsInitialized(true);
    }
  }, [restaurant, detailsInitialized]);

  useEffect(() => {
    if (restaurant) {
      setExistingDrafts(restaurant.menu.map(toDraft));
    }
  }, [restaurant?.menu]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>
          Restaurant not found
        </Text>
      </View>
    );
  }

  const isOwner =
    !!user && !!restaurant.ownerId && restaurant.ownerId === user.id;

  if (!isOwner) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, padding: 24, gap: 12 },
        ]}
      >
        <Feather name='lock' size={32} color={colors.mutedForeground} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.foreground,
            fontFamily: 'Inter_700Bold',
          }}
        >
          Access denied
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
            textAlign: 'center',
          }}
        >
          Only the owner of this restaurant can manage it.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 8,
            paddingHorizontal: 22,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: colors.primary,
          }}
        >
          <Text style={{ color: '#FFF', fontFamily: 'Inter_600SemiBold' }}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Details mutations ──────────────────────────────────────────────────────

  async function saveDetails() {
    if (!name.trim()) {
      Alert.alert('Check details', 'Restaurant name is required.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Check details', 'Street address is required.');
      return;
    }
    setSavingDetails(true);
    try {
      await updateRestaurant(restaurantId!, {
        name: name.trim(),
        description: description.trim() || undefined,
        cuisine,
        images,
        location: {
          address: address.trim(),
          city: city.trim() || undefined,
          area: area.trim() || undefined,
        },
        contactPhone: phone.trim() || undefined,
        openingHours: Object.fromEntries(
          DAYS.map((day) => [
            day,
            {
              open: hours[day].isClosed ? undefined : hours[day].open,
              close: hours[day].isClosed ? undefined : hours[day].close,
              isClosed: hours[day].isClosed,
            },
          ]),
        ),
        deliveryAvailable,
        minimumOrder: deliveryAvailable ? Number(minimumOrder) || 0 : 0,
      });
      Alert.alert('Saved', 'Your restaurant details have been updated.');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      setSavingDetails(false);
    }
  }

  function confirmDeactivate() {
    Alert.alert(
      'Delete restaurant?',
      'This will permanently delete your restaurant and all its data from the database. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            setDeactivating(true);
            try {
              await deleteRestaurant(restaurantId!);
              router.replace('/restaurants');
            } catch (e: any) {
              Alert.alert(
                'Could not delete',
                e?.message ?? 'Please try again.',
              );
            } finally {
              setDeactivating(false);
            }
          },
        },
      ],
    );
  }

  // ── Menu mutations ─────────────────────────────────────────────────────────

  function updateExisting(key: string, patch: Partial<MenuItemDraft>) {
    setExistingDrafts((prev) =>
      prev.map((d) => (d._key === key ? { ...d, ...patch } : d)),
    );
  }

  function updateNew(key: string, patch: Partial<MenuItemDraft>) {
    setNewDrafts((prev) =>
      prev.map((d) => (d._key === key ? { ...d, ...patch } : d)),
    );
  }

  function addNewItem() {
    const draft = blankMenuDraft();
    setNewDrafts((prev) => [...prev, draft]);
    setExpandedKey(draft._key);
  }

  function discardNewItem(key: string) {
    setNewDrafts((prev) => prev.filter((d) => d._key !== key));
    if (expandedKey === key) setExpandedKey(null);
  }

  async function saveExisting(draft: MenuItemDraft) {
    const err = validateMenuDraft(draft);
    if (err) {
      Alert.alert('Check item details', err);
      return;
    }
    setSavingKey(draft._key);
    try {
      await updateMenuItem(restaurantId!, draft.id!, {
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        price: Number(draft.price),
        category: draft.category,
        isVegetarian: draft.isVegetarian,
        isAvailable: draft.isAvailable,
        spiceLevel: draft.spiceLevel,
        image: draft.image ?? null,
      });
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      setSavingKey(null);
    }
  }

  async function saveNew(draft: MenuItemDraft) {
    const err = validateMenuDraft(draft);
    if (err) {
      Alert.alert('Check item details', err);
      return;
    }
    setSavingKey(draft._key);
    try {
      await addMenuItem(restaurantId!, {
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        price: Number(draft.price),
        category: draft.category,
        isVegetarian: draft.isVegetarian,
        isAvailable: draft.isAvailable,
        spiceLevel: draft.spiceLevel,
        image: draft.image ?? null,
      });
      setNewDrafts((prev) => prev.filter((d) => d._key !== draft._key));
      setExpandedKey(null);
    } catch (e: any) {
      Alert.alert('Could not add item', e?.message ?? 'Please try again.');
    } finally {
      setSavingKey(null);
    }
  }

  function confirmDeleteExisting(draft: MenuItemDraft) {
    Alert.alert(
      'Delete item?',
      `Remove "${draft.name || 'this item'}" from your menu? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(draft.id!);
            try {
              await deleteMenuItem(restaurantId!, draft.id!);
              if (expandedKey === draft._key) setExpandedKey(null);
            } catch (e: any) {
              Alert.alert(
                'Could not delete',
                e?.message ?? 'Please try again.',
              );
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  }

  const totalItems = existingDrafts.length + newDrafts.length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          backgroundColor: colors.navy,
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          gap: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name='arrow-left' size={20} color='#FFFFFF' />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Manage Restaurant</Text>
            <Text style={styles.headerSubtitle}>{restaurant.name}</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('details')}
            style={[
              styles.tabBtn,
              activeTab === 'details' && {
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                { opacity: activeTab === 'details' ? 1 : 0.6 },
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('menu')}
            style={[
              styles.tabBtn,
              activeTab === 'menu' && {
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                { opacity: activeTab === 'menu' ? 1 : 0.6 },
              ]}
            >
              Menu ({totalItems})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        {activeTab === 'details' ? (
          <DetailsTab
            images={images}
            setImages={setImages}
            bannerUploading={bannerUploading}
            setBannerUploading={setBannerUploading}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            phone={phone}
            setPhone={setPhone}
            address={address}
            setAddress={setAddress}
            city={city}
            setCity={setCity}
            area={area}
            setArea={setArea}
            cuisine={cuisine}
            setCuisine={setCuisine}
            hours={hours}
            setHours={setHours}
            deliveryAvailable={deliveryAvailable}
            setDeliveryAvailable={setDeliveryAvailable}
            minimumOrder={minimumOrder}
            setMinimumOrder={setMinimumOrder}
            onSave={saveDetails}
            saving={savingDetails}
            onDeactivate={confirmDeactivate}
            deactivating={deactivating}
            colors={colors}
          />
        ) : (
          <MenuTab
            existingDrafts={existingDrafts}
            newDrafts={newDrafts}
            expandedKey={expandedKey}
            setExpandedKey={setExpandedKey}
            updateExisting={updateExisting}
            updateNew={updateNew}
            saveExisting={saveExisting}
            saveNew={saveNew}
            confirmDeleteExisting={confirmDeleteExisting}
            discardNewItem={discardNewItem}
            addNewItem={addNewItem}
            savingKey={savingKey}
            removingId={removingId}
            colors={colors}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  itemBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 14,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  unavailableBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
