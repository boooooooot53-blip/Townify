import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useData, Restaurant } from '@/context/DataContext';
import {
  Badge,
  Card,
  Input,
  SectionHeader,
} from '@/components/ThemedComponents';

function RestaurantCard({
  restaurant,
  onPress,
}: {
  restaurant: Restaurant;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={{ marginBottom: 20, padding: 0 }}>
        {/* Banner */}
        <View
          style={[
            styles.restaurantBanner,
            {
              backgroundColor: restaurant.isOpen
                ? colors.accent + '18'
                : colors.muted,
            },
          ]}
        >
          {restaurant.images && restaurant.images.length > 0 ? (
            <Image
              source={{ uri: restaurant.images[0] }}
              style={styles.restaurantBannerImage}
              resizeMode='cover'
            />
          ) : (
            <Feather
              name='coffee'
              size={40}
              color={restaurant.isOpen ? colors.accent : colors.mutedForeground}
            />
          )}
          
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          
          {!restaurant.isOpen && (
            <View
              style={[
                styles.closedOverlay,
                { backgroundColor: 'rgba(0,0,0,0.5)' },
              ]}
            >
              <Text
                style={{
                  color: '#FFF',
                  fontWeight: '800',
                  fontSize: 18,
                  fontFamily: 'Inter_800ExtraBold',
                  letterSpacing: 2,
                }}
              >
                CLOSED
              </Text>
            </View>
          )}
          
          {restaurant.deals.length > 0 && (
            <View
              style={[
                styles.dealBadge,
                { backgroundColor: colors.destructive, flexDirection: 'row', alignItems: 'center', gap: 4 },
              ]}
            >
              <Feather name="tag" size={12} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                {restaurant.deals[0].discount}
              </Text>
            </View>
          )}

          {/* Floating Rating */}
          <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }}>
            <Feather name='star' size={14} color='#F59E0B' />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground, fontFamily: 'Inter_700Bold' }}>
              {restaurant.rating}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
              ({restaurant.reviews})
            </Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
              >
                {restaurant.name}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_500Medium',
                  marginTop: 4,
                }}
              >
                {restaurant.category} · {restaurant.priceRange}
              </Text>
            </View>
          </View>

          {/* Quick Info Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border }}>
              <Feather name='clock' size={12} color={colors.primary} />
              <Text style={{ fontSize: 12, color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>
                {restaurant.deliveryTime}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border }}>
              <Feather name='map-pin' size={12} color={colors.primary} />
              <Text style={{ fontSize: 12, color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>
                {restaurant.distance}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border }}>
              <Feather name='shopping-bag' size={12} color={colors.primary} />
              <Text style={{ fontSize: 12, color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>
                Min. Rs. {restaurant.minOrder}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function ListYourRestaurantBanner({
  colors,
}: {
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={() => router.push('/create-restaurant')}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.listBanner,
          {
            backgroundColor: colors.secondary,
            borderColor: colors.border,
            borderWidth: 3,
            shadowColor: colors.border,
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
          },
        ]}
      >
        <View
          style={[
            styles.listBannerIcon,
            { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
          ]}
        >
          <Feather name='plus-circle' size={20} color={colors.foreground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.foreground,
              fontFamily: 'Inter_700Bold',
            }}
          >
            Own a restaurant?
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
              marginTop: 2,
            }}
          >
            List it here and add your menu in minutes
          </Text>
        </View>
        <Feather
          name='chevron-right'
          size={18}
          color={colors.mutedForeground}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function RestaurantsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { restaurants, restaurantsState, fetchRestaurants } = useData();
  const [search, setSearch] = useState('');
  const [ownsRestaurant, setOwnsRestaurant] = useState(false);

  useEffect(() => {
    fetchRestaurants(search ? { search } : undefined);
  }, [fetchRestaurants, search]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        AsyncStorage.getItem(`ownsRestaurant_${user.id}`).then((val) => {
          setOwnsRestaurant(val === 'true');
        });
      }
    }, [user])
  );

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = restaurants.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.primary,
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          borderBottomWidth: 4,
          borderBottomColor: colors.border,
          zIndex: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Food & Restaurants</Text>
          <Text style={styles.headerSubtitle}>
            Order from nearby restaurants
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 80 : 20,
        }}
      >
        <View style={{ padding: 20, gap: 16 }}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder='Search restaurants or cuisine...'
            leftIcon={
              <Feather name='search' size={16} color={colors.mutedForeground} />
            }
          />

          {user?.role !== 'worker' && ownsRestaurant && (
            <ListYourRestaurantBanner colors={colors} />
          )}

          {restaurantsState.loading && restaurants.length === 0 ? (
            <ActivityIndicator
              size='large'
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : null}

          {restaurantsState.error ? (
            <Text
              style={{
                color: colors.destructive,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {restaurantsState.error}
            </Text>
          ) : null}

          <SectionHeader
            title={`${filtered.length} Restaurants`}
            subtitle='Sorted by rating'
          />

          {filtered.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              onPress={() =>
                router.push({
                  pathname: '/restaurant-detail',
                  params: { restaurantId: r.id },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
  listBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 3,
    borderRadius: 20,
    padding: 16,
  },
  listBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantBanner: {
    height: 160,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  restaurantBannerImage: {
    width: '100%',
    height: '100%',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
