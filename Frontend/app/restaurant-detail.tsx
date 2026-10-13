import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useData, MenuItem } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card } from '@/components/ThemedComponents';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RestaurantDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const { restaurants, fetchRestaurantById } = useData();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await fetchRestaurantById(restaurantId!);
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [restaurantId, fetchRestaurantById]),
  );

  const restaurant = restaurants.find((r) => r.id === restaurantId);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>
          Restaurant not found
        </Text>
      </View>
    );
  }

  const isOwner =
    !!user && !!restaurant.ownerId && restaurant.ownerId === user.id;
  const images: string[] =
    restaurant.images && restaurant.images.length > 0
      ? restaurant.images
      : [];

  const menuCategories = Array.from(
    new Set(restaurant.menu.map((m) => m.category)),
  );

  const phone = restaurant.contactPhone;
  const bottomPad = Platform.OS === 'web' ? 60 : insets.bottom + 16;

  function callRestaurant() {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
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
          <Text style={styles.headerTitle}>{restaurant.name}</Text>
          <Text style={styles.headerSubtitle}>
            {restaurant.category} · {restaurant.deliveryTime}
          </Text>
        </View>
        <Badge
          label={restaurant.isOpen ? 'Open' : 'Closed'}
          variant={restaurant.isOpen ? 'success' : 'danger'}
        />
        {isOwner && (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/manage-restaurant',
                params: { restaurantId: restaurant.id },
              })
            }
            style={styles.editBtn}
          >
            <Feather name='edit-2' size={16} color='#FFFFFF' />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: phone ? 100 : bottomPad,
        }}
      >
        {/* ── Photo gallery ── */}
        {images.length > 0 && (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setActiveImage(idx);
              }}
            >
              {images.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => {
                    setActiveImage(idx);
                    setImageViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri }}
                    style={styles.galleryImage}
                    resizeMode='cover'
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.galleryDots}>
                {images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        width: idx === activeImage ? 16 : 6,
                        backgroundColor:
                          idx === activeImage ? colors.primary : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ padding: 20 }}>
          {/* ── Stats row ── */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Feather
                name='shopping-bag'
                size={14}
                color={colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                Min Rs. {restaurant.minOrder}
              </Text>
            </View>
          </View>

          {/* ── Description ── */}
          {restaurant.description ? (
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
                lineHeight: 21,
                marginBottom: 16,
              }}
            >
              {restaurant.description}
            </Text>
          ) : null}

          {/* ── Contact row (inline, not a CTA — the sticky bar is the CTA) ── */}
          {phone ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Feather name='phone' size={14} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {phone}
              </Text>
            </View>
          ) : null}

          {/* ── Deals ── */}
          {restaurant.deals.length > 0 && (
            <View style={{ gap: 10, marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                Active Deals
              </Text>
              {restaurant.deals.map((deal) => (
                <View
                  key={deal.id}
                  style={[
                    styles.dealCard,
                    {
                      backgroundColor: colors.destructive + '12',
                      borderColor: colors.destructive + '30',
                    },
                  ]}
                >
                  <Feather name='tag' size={16} color={colors.destructive} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: colors.destructive,
                        fontFamily: 'Inter_700Bold',
                      }}
                    >
                      {deal.discount} · {deal.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.mutedForeground,
                        fontFamily: 'Inter_400Regular',
                      }}
                    >
                      Valid till: {deal.validTill}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Empty menu state ── */}
          {restaurant.menu.length === 0 && (
            <View
              style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}
            >
              <Feather name='coffee' size={36} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: 15,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                  textAlign: 'center',
                }}
              >
                {isOwner
                  ? 'No menu items yet. Tap the edit button to add some.'
                  : 'Menu coming soon.'}
              </Text>
            </View>
          )}

          {/* ── Menu (view-only, no cart) ── */}
          {menuCategories.map((cat) => (
            <View key={cat} style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                  marginBottom: 12,
                  textTransform: 'capitalize',
                }}
              >
                {cat}
              </Text>
              {restaurant.menu
                .filter((m) => m.category === cat)
                .map((item) => (
                  <Card key={item.id} style={{ marginBottom: 10 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.menuItemImage}
                          resizeMode='cover'
                        />
                      ) : null}

                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: '600',
                              color: colors.foreground,
                              fontFamily: 'Inter_600SemiBold',
                            }}
                          >
                            {item.name}
                          </Text>
                          {item.popular && (
                            <Badge label='Popular' variant='info' />
                          )}
                        </View>
                        {item.description ? (
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.mutedForeground,
                              fontFamily: 'Inter_400Regular',
                              marginTop: 3,
                              lineHeight: 19,
                            }}
                          >
                            {item.description}
                          </Text>
                        ) : null}
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: colors.primary,
                            fontFamily: 'Inter_700Bold',
                            marginTop: 6,
                          }}
                        >
                          Rs. {item.price.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Sticky "Call to Order" bar — shown when the restaurant has a phone number ── */}
      {phone ? (
        <View
          style={[
            styles.callBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Platform.OS === 'web' ? 16 : insets.bottom + 12,
            },
          ]}
        >
          <TouchableOpacity
            onPress={callRestaurant}
            style={[styles.callBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Feather name='phone-call' size={18} color='#FFFFFF' />
            <Text style={styles.callBtnText}>Call to Order</Text>
            <Text
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
                fontFamily: 'Inter_400Regular',
                marginLeft: 'auto',
              }}
            >
              {phone}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Image Viewer Modal ── */}
      <Modal visible={imageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
        <ImageViewer
          imageUrls={images.map((uri) => ({ url: uri }))}
          index={activeImage}
          enableSwipeDown={true}
          onSwipeDown={() => setImageViewerVisible(false)}
          onClick={() => setImageViewerVisible(false)}
          renderIndicator={() => <View />}
          onChange={(idx) => idx !== undefined && setActiveImage(idx)}
        />
      </Modal>
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
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 220,
  },
  galleryDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  menuItemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  dealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  callBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  callBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
});
