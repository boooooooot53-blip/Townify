import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { useData } from '@/context/DataContext';
import {
  pickImage,
  uploadToCloudinary,
  uploadImages,
} from '@/utils/imageUpload';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

const MENU_CATEGORIES = [
  'appetizer',
  'main',
  'dessert',
  'beverage',
  'side',
  'special',
] as const;

const SPICE_LEVELS = ['mild', 'medium', 'hot', 'extra_hot'] as const;

interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

interface MenuItemDraft {
  _key: string;
  name: string;
  description: string;
  price: string;
  category: (typeof MENU_CATEGORIES)[number];
  isVegetarian: boolean;
  spiceLevel: (typeof SPICE_LEVELS)[number];
  imageUri: string | null;
  imageUrl: string | null;
  imageUploading: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function blankDay(): DayHours {
  return { open: '09:00', close: '22:00', isClosed: false };
}

function blankHours(): Record<DayKey, DayHours> {
  return Object.fromEntries(DAYS.map((d) => [d, blankDay()])) as Record<
    DayKey,
    DayHours
  >;
}

function blankMenuItem(): MenuItemDraft {
  return {
    _key: Date.now().toString() + Math.random().toString(36).slice(2),
    name: '',
    description: '',
    price: '',
    category: 'main',
    isVegetarian: false,
    spiceLevel: 'mild',
    imageUri: null,
    imageUrl: null,
    imageUploading: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepIndicator({
  current,
  total,
  colors,
}: {
  current: number;
  total: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            backgroundColor:
              i < current
                ? colors.primary
                : i === current
                  ? colors.primary + '60'
                  : colors.border,
          }}
        />
      ))}
    </View>
  );
}

function Field({
  label,
  hint,
  children,
  colors,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
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
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
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
        backgroundColor: colors.card,
        minHeight: multiline ? 80 : undefined,
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
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary + '15' : colors.card,
      }}
    >
      <Text
        style={{
          fontSize: 13,
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
// ImagePickerTile
// ─────────────────────────────────────────────────────────────────────────────

function ImagePickerTile({
  uri,
  uploading,
  onPick,
  onRemove,
  size = 80,
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
        style={[
          styles.imageTile,
          {
            width: size,
            height: size,
            borderRadius: 10,
            backgroundColor: colors.muted,
            borderColor: colors.border,
          },
        ]}
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
          style={[
            styles.removeImageBtn,
            { backgroundColor: colors.destructive },
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Feather name='x' size={12} color='#FFF' />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPick}
      style={[
        styles.imageTile,
        {
          width: size,
          height: size,
          borderRadius: 10,
          borderColor: colors.primary + '50',
          backgroundColor: colors.primary + '08',
        },
      ]}
    >
      <Feather name='camera' size={22} color={colors.primary} />
      <Text
        style={{
          fontSize: 11,
          color: colors.primary,
          fontFamily: 'Inter_400Regular',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        Add photo
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 0 — Basic info + restaurant images
// ─────────────────────────────────────────────────────────────────────────────

function StepBasic({
  name,
  setName,
  description,
  setDescription,
  phone,
  setPhone,
  bannerUris,
  setBannerUris,
  bannerUploading,
  setBannerUploading,
  colors,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  bannerUris: string[];
  setBannerUris: (v: string[]) => void;
  bannerUploading: boolean;
  setBannerUploading: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  async function handlePickBanners() {
    try {
      const uris = await pickImage({ allowsMultiple: true, selectionLimit: 4 });
      if (!uris.length) return;
      setBannerUploading(true);
      const urls = await uploadImages(uris);
      setBannerUris([...bannerUris, ...urls].slice(0, 4));
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Could not upload images.');
    } finally {
      setBannerUploading(false);
    }
  }

  return (
    <View style={{ gap: 20 }}>
      <Field label='Restaurant name *' colors={colors}>
        <StyledInput
          value={name}
          onChangeText={setName}
          placeholder='e.g. Lahori Darbar'
          colors={colors}
        />
      </Field>
      <Field label='Description' colors={colors} hint='Up to 1000 characters'>
        <StyledInput
          value={description}
          onChangeText={setDescription}
          placeholder='Tell customers what makes your place special'
          multiline
          numberOfLines={4}
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
      <Field
        label='Restaurant photos'
        colors={colors}
        hint='Up to 4 photos. First photo is used as the banner.'
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 2,
          }}
        >
          {bannerUris.map((url) => (
            <ImagePickerTile
              key={url}
              uri={url}
              uploading={false}
              onPick={() => {}}
              onRemove={() =>
                setBannerUris(bannerUris.filter((u) => u !== url))
              }
              size={90}
              colors={colors}
            />
          ))}
          {bannerUris.length < 4 && (
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
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Location & cuisine
// ─────────────────────────────────────────────────────────────────────────────

function StepLocation({
  address,
  setAddress,
  city,
  setCity,
  area,
  setArea,
  cuisine,
  setCuisine,
  colors,
}: {
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  cuisine: string[];
  setCuisine: (v: string[]) => void;
  colors: ReturnType<typeof useColors>;
}) {
  function toggleCuisine(c: string) {
    setCuisine(
      cuisine.includes(c) ? cuisine.filter((x) => x !== c) : [...cuisine, c],
    );
  }
  return (
    <View style={{ gap: 20 }}>
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
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 2,
          }}
        >
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
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Opening hours
// ─────────────────────────────────────────────────────────────────────────────

function StepHours({
  hours,
  setHours,
  colors,
}: {
  hours: Record<DayKey, DayHours>;
  setHours: (v: Record<DayKey, DayHours>) => void;
  colors: ReturnType<typeof useColors>;
}) {
  function update(day: DayKey, patch: Partial<DayHours>) {
    setHours({ ...hours, [day]: { ...hours[day], ...patch } });
  }
  return (
    <View style={{ gap: 12 }}>
      {DAYS.map((day) => {
        const h = hours[day];
        return (
          <View
            key={day}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              backgroundColor: colors.card,
              gap: 10,
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
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
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
                  onValueChange={(v) => update(day, { isClosed: !v })}
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
                    onChangeText={(t) => update(day, { open: t })}
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
                    onChangeText={(t) => update(day, { close: t })}
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Delivery
// ─────────────────────────────────────────────────────────────────────────────

function StepDelivery({
  deliveryAvailable,
  setDeliveryAvailable,
  minimumOrder,
  setMinimumOrder,
  colors,
}: {
  deliveryAvailable: boolean;
  setDeliveryAvailable: (v: boolean) => void;
  minimumOrder: string;
  setMinimumOrder: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 20 }}>
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
      {!deliveryAvailable && (
        <View
          style={{
            backgroundColor: colors.accent + '15',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <Feather
            name='info'
            size={16}
            color={colors.accent}
            style={{ marginTop: 1 }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: colors.foreground,
              fontFamily: 'Inter_400Regular',
              lineHeight: 20,
            }}
          >
            Pickup only mode — customers will see "Pickup only" instead of a
            delivery time.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Menu with per-item image upload
// ─────────────────────────────────────────────────────────────────────────────

function StepMenu({
  items,
  setItems,
  colors,
}: {
  items: MenuItemDraft[];
  setItems: (v: MenuItemDraft[]) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState<string | null>(
    items[0]?._key ?? null,
  );

  function addItem() {
    const item = blankMenuItem();
    setItems([...items, item]);
    setExpanded(item._key);
  }

  function removeItem(key: string) {
    setItems(items.filter((i) => i._key !== key));
    if (expanded === key) setExpanded(null);
  }

  function updateItem(key: string, patch: Partial<MenuItemDraft>) {
    setItems(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  }

  async function handlePickItemImage(key: string) {
    try {
      const uris = await pickImage({ allowsEditing: true, aspect: [1, 1] });
      if (!uris.length) return;
      updateItem(key, { imageUploading: true });
      const url = await uploadToCloudinary(uris[0]);
      updateItem(key, {
        imageUri: uris[0],
        imageUrl: url,
        imageUploading: false,
      });
    } catch (e: any) {
      updateItem(key, { imageUploading: false });
      Alert.alert('Upload failed', e?.message ?? 'Could not upload image.');
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontSize: 13,
          color: colors.mutedForeground,
          fontFamily: 'Inter_400Regular',
          lineHeight: 19,
        }}
      >
        Add your menu items now or skip — you can always add more later from
        your restaurant dashboard.
      </Text>

      {items.map((item) => {
        const isOpen = expanded === item._key;
        const hasName = item.name.trim().length > 0;
        return (
          <View
            key={item._key}
            style={{
              borderWidth: 1,
              borderColor: isOpen ? colors.primary + '60' : colors.border,
              borderRadius: 12,
              backgroundColor: colors.card,
              overflow: 'hidden',
            }}
          >
            {/* Collapsed row */}
            <TouchableOpacity
              onPress={() => setExpanded(isOpen ? null : item._key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                gap: 10,
              }}
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: colors.muted,
                  }}
                  resizeMode='cover'
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather
                    name='image'
                    size={16}
                    color={colors.mutedForeground}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: hasName ? colors.foreground : colors.mutedForeground,
                    fontFamily: 'Inter_600SemiBold',
                  }}
                >
                  {hasName ? item.name : 'Untitled item'}
                </Text>
                {hasName && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                      fontFamily: 'Inter_400Regular',
                      marginTop: 2,
                    }}
                  >
                    {item.category} · Rs. {item.price || '0'}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => removeItem(item._key)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name='trash-2' size={16} color={colors.destructive} />
              </TouchableOpacity>
              <Feather
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            {/* Expanded form */}
            {isOpen && (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingBottom: 16,
                  gap: 14,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 14,
                }}
              >
                <Field
                  label='Item photo'
                  colors={colors}
                  hint='Square photo works best'
                >
                  <ImagePickerTile
                    uri={item.imageUrl ?? item.imageUri}
                    uploading={item.imageUploading}
                    onPick={() => handlePickItemImage(item._key)}
                    onRemove={() =>
                      updateItem(item._key, { imageUri: null, imageUrl: null })
                    }
                    size={90}
                    colors={colors}
                  />
                </Field>
                <Field label='Item name *' colors={colors}>
                  <StyledInput
                    value={item.name}
                    onChangeText={(v) => updateItem(item._key, { name: v })}
                    placeholder='e.g. Chicken Karahi'
                    colors={colors}
                  />
                </Field>
                <Field label='Description' colors={colors}>
                  <StyledInput
                    value={item.description}
                    onChangeText={(v) =>
                      updateItem(item._key, { description: v })
                    }
                    placeholder='Short description'
                    multiline
                    numberOfLines={2}
                    colors={colors}
                  />
                </Field>
                <Field label='Price (Rs.) *' colors={colors}>
                  <StyledInput
                    value={item.price}
                    onChangeText={(v) => updateItem(item._key, { price: v })}
                    placeholder='350'
                    keyboardType='numeric'
                    colors={colors}
                  />
                </Field>
                <Field label='Category' colors={colors}>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
                  >
                    {MENU_CATEGORIES.map((cat) => (
                      <Chip
                        key={cat}
                        label={cat}
                        selected={item.category === cat}
                        onPress={() => updateItem(item._key, { category: cat })}
                        colors={colors}
                      />
                    ))}
                  </View>
                </Field>
                <Field label='Spice level' colors={colors}>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
                  >
                    {SPICE_LEVELS.map((level) => (
                      <Chip
                        key={level}
                        label={level.replace('_', ' ')}
                        selected={item.spiceLevel === level}
                        onPress={() =>
                          updateItem(item._key, { spiceLevel: level })
                        }
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
                  }}
                >
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
                    value={item.isVegetarian}
                    onValueChange={(v) =>
                      updateItem(item._key, { isVegetarian: v })
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + '80',
                    }}
                    thumbColor={
                      item.isVegetarian
                        ? colors.primary
                        : colors.mutedForeground
                    }
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        onPress={addItem}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          borderRadius: 12,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.primary + '60',
          backgroundColor: colors.primary + '08',
        }}
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

const STEPS = [
  'Basic info',
  'Location & cuisine',
  'Opening hours',
  'Delivery',
  'Menu',
];
const TOTAL_STEPS = STEPS.length;

export default function CreateRestaurantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createRestaurant, addMenuItem } = useData();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [bannerUris, setBannerUris] = useState<string[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Step 1
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [cuisine, setCuisine] = useState<string[]>([]);

  // Step 2
  const [hours, setHours] = useState<Record<DayKey, DayHours>>(blankHours());

  // Step 3
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [minimumOrder, setMinimumOrder] = useState('0');

  // Step 4
  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  function validateStep(): string | null {
    if (step === 0) {
      if (!name.trim()) return 'Restaurant name is required.';
      if (bannerUploading) return 'Please wait for images to finish uploading.';
    }
    if (step === 1) {
      if (!address.trim()) return 'Street address is required.';
    }
    if (step === 4) {
      for (const item of menuItems) {
        if (!item.name.trim()) return 'Every menu item needs a name.';
        if (!item.price || isNaN(Number(item.price)) || Number(item.price) < 0)
          return `"${item.name || 'Untitled'}" needs a valid price.`;
        if (item.imageUploading)
          return 'Please wait for item images to finish uploading.';
      }
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) {
      Alert.alert('Check your details', err);
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const restaurant = await createRestaurant({
        name: name.trim(),
        description: description.trim() || undefined,
        cuisine,
        location: {
          address: address.trim(),
          city: city.trim() || undefined,
          area: area.trim() || undefined,
        },
        contactPhone: phone.trim() || undefined,
        images: bannerUris,
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

      for (const item of menuItems) {
        if (!item.name.trim()) continue;
        await addMenuItem(restaurant.id, {
          name: item.name.trim(),
          description: item.description.trim() || undefined,
          price: Number(item.price),
          category: item.category,
          isVegetarian: item.isVegetarian,
          spiceLevel: item.spiceLevel,
          image: item.imageUrl ?? undefined,
        });
      }

      Alert.alert('Restaurant listed!', `${restaurant.name} is now live.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.navy,
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity
            onPress={() => (step === 0 ? router.back() : setStep(step - 1))}
            style={styles.backBtn}
          >
            <Feather name='arrow-left' size={20} color='#FFFFFF' />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>List your restaurant</Text>
            <Text style={styles.headerSubtitle}>
              Step {step + 1} of {TOTAL_STEPS} — {STEPS[step]}
            </Text>
          </View>
        </View>
        <StepIndicator current={step + 1} total={TOTAL_STEPS} colors={colors} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        {step === 0 && (
          <StepBasic
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            phone={phone}
            setPhone={setPhone}
            bannerUris={bannerUris}
            setBannerUris={setBannerUris}
            bannerUploading={bannerUploading}
            setBannerUploading={setBannerUploading}
            colors={colors}
          />
        )}
        {step === 1 && (
          <StepLocation
            address={address}
            setAddress={setAddress}
            city={city}
            setCity={setCity}
            area={area}
            setArea={setArea}
            cuisine={cuisine}
            setCuisine={setCuisine}
            colors={colors}
          />
        )}
        {step === 2 && (
          <StepHours hours={hours} setHours={setHours} colors={colors} />
        )}
        {step === 3 && (
          <StepDelivery
            deliveryAvailable={deliveryAvailable}
            setDeliveryAvailable={setDeliveryAvailable}
            minimumOrder={minimumOrder}
            setMinimumOrder={setMinimumOrder}
            colors={colors}
          />
        )}
        {step === 4 && (
          <StepMenu items={menuItems} setItems={setMenuItems} colors={colors} />
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 16,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={submitting || bannerUploading}
          style={[
            styles.nextBtn,
            {
              backgroundColor:
                submitting || bannerUploading
                  ? colors.primary + '60'
                  : colors.primary,
            },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color='#FFF' />
          ) : (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Text style={styles.nextBtnText}>
                {step === TOTAL_STEPS - 1 ? 'Publish restaurant' : 'Continue'}
              </Text>
              <Feather
                name={step === TOTAL_STEPS - 1 ? 'check' : 'arrow-right'}
                size={18}
                color='#FFF'
              />
            </View>
          )}
        </TouchableOpacity>
        {step === TOTAL_STEPS - 1 && menuItems.length === 0 && (
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            You can add menu items after publishing
          </Text>
        )}
      </View>
    </View>
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  nextBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  imageTile: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
