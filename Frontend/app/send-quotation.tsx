import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import ImageViewer from 'react-native-image-zoom-viewer';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { getErrorMessage } from '@/api/axios';
import { useData } from '@/context/DataContext';
import { Button, Card, Input } from '@/components/ThemedComponents';

export default function SendQuotationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    requestId,
    category,
    description,
    userName,
    userLocation,
    userAvatar,
    images,
  } = useLocalSearchParams<{
    requestId: string;
    category: string;
    description: string;
    userName?: string;
    userLocation?: string;
    userAvatar?: string;
    images?: string;
  }>();
  
  const parsedImages = images ? JSON.parse(images) : [];
  const { createQuotation } = useData();

  const [price, setPrice] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const TIME_OPTIONS = [
    '1-2 hours',
    '2-3 hours',
    '3-4 hours',
    'Half day',
    'Full day',
    '2 days',
  ];

  function validate() {
    const e: Record<string, string> = {};
    if (!price || isNaN(Number(price)) || Number(price) <= 0)
      e.price = 'Please enter a valid price.';
    if (!estimatedTime) e.time = 'Please select estimated time.';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    setSubmitError('');
    try {
      const durationMatch = estimatedTime.match(/(\d+)/);
      const durationValue = durationMatch ? parseInt(durationMatch[1], 10) : 2;
      const durationUnit = estimatedTime.toLowerCase().includes('day')
        ? 'days'
        : 'hours';

      await createQuotation({
        serviceRequestId: requestId,
        amount: Number(price),
        description: note.trim() || `Estimated completion: ${estimatedTime}`,
        estimatedDuration: {
          value: durationValue,
          unit: durationUnit as 'hours' | 'days',
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Failed to submit quotation.'));
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
          <Text style={styles.headerTitle}>Send Quotation</Text>
          <Text style={styles.headerSubtitle}>
            Submit your offer for this job
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: bottomInset + 24,
          gap: 20,
        }}
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

        {/* Job Summary Card */}
        <Card style={{ backgroundColor: colors.navy + 'CC' }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.accent,
              fontFamily: 'Inter_600SemiBold',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Job Details
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primary + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name='tool' size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  fontFamily: 'Inter_700Bold',
                  textTransform: 'capitalize',
                }}
              >
                {(category ?? '').replace('_', ' ')}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'Inter_400Regular',
                  marginTop: 3,
                  lineHeight: 19,
                }}
              >
                {description}
              </Text>
              
              {parsedImages.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {parsedImages.map((uri: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setImageIndex(index);
                        setImageViewerVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri }}
                        style={{ width: 60, height: 60, borderRadius: 8 }}
                        contentFit='cover'
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            
            {userName || userAvatar ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {userAvatar ? (
                    <Image
                      source={{ uri: userAvatar }}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                      contentFit='cover'
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: '#FFFFFF',
                        fontFamily: 'Inter_700Bold',
                      }}
                    >
                      {(userName ?? 'U').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 16,
                    flexWrap: 'wrap',
                    flexShrink: 1,
                  }}
                >
                  {userName ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Feather
                        name='user'
                        size={12}
                        color='rgba(255,255,255,0.5)'
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.5)',
                          fontFamily: 'Inter_400Regular',
                        }}
                      >
                        {userName}
                      </Text>
                    </View>
                  ) : null}
                  {userLocation ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Feather
                        name='map-pin'
                        size={12}
                        color='rgba(255,255,255,0.5)'
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.5)',
                          fontFamily: 'Inter_400Regular',
                        }}
                      >
                        {userLocation}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>

        </Card>

        {/* Price */}
        <Input
          label='Your Price (Rs.) *'
          value={price}
          onChangeText={(t) => {
            setPrice(t);
            setErrors((e) => ({ ...e, price: '' }));
          }}
          placeholder='e.g. 2500'
          keyboardType='numeric'
          error={errors.price}
          leftIcon={
            <Feather
              name='credit-card'
              size={16}
              color={colors.mutedForeground}
            />
          }
        />

        {/* Estimated Time */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: errors.time ? colors.destructive : colors.mutedForeground,
              fontFamily: 'Inter_500Medium',
            }}
          >
            Estimated Time *
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TIME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  setEstimatedTime(t);
                  setErrors((e) => ({ ...e, time: '' }));
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 100,
                  borderWidth: 1.5,
                  backgroundColor:
                    estimatedTime === t ? colors.primary + '15' : colors.card,
                  borderColor:
                    estimatedTime === t ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Inter_500Medium',
                    color:
                      estimatedTime === t ? colors.primary : colors.foreground,
                  }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.time ? (
            <Text
              style={{
                fontSize: 12,
                color: colors.destructive,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {errors.time}
            </Text>
          ) : null}
        </View>

        {/* Note */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.mutedForeground,
              fontFamily: 'Inter_500Medium',
            }}
          >
            Additional Note (optional)
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              borderWidth: 1.5,
              borderColor: colors.border,
              padding: 14,
            }}
          >
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Describe what's included, materials, etc."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical='top'
              style={{
                fontSize: 15,
                color: colors.foreground,
                fontFamily: 'Inter_400Regular',
                minHeight: 80,
              }}
            />
          </View>
        </View>

        {/* Info box */}
        <View
          style={{
            backgroundColor: colors.info + '12',
            borderRadius: colors.radius,
            padding: 12,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <Feather
            name='info'
            size={15}
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
            The user will compare your quotation with others. A competitive
            price and clear note improves acceptance chances.
          </Text>
        </View>

        <Button
          title='Submit Quotation'
          onPress={handleSubmit}
          loading={loading}
          size='lg'
        />
      </ScrollView>
      <Modal visible={imageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
        <ImageViewer
          imageUrls={parsedImages.map((uri: string) => ({ url: uri }))}
          index={imageIndex}
          enableSwipeDown={true}
          onSwipeDown={() => setImageViewerVisible(false)}
          onClick={() => setImageViewerVisible(false)}
          renderIndicator={() => <View />}
        />
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
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
