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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ marginBottom: 14 }}>
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
              size={32}
              color={restaurant.isOpen ? colors.accent : colors.mutedForeground}
            />
          )}
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
                  fontWeight: '700',
                  fontSize: 16,
                  fontFamily: 'Inter_700Bold',
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
                { backgroundColor: colors.destructive },
              ]}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                {restaurant.deals[0].discount}
              </Text>
            </View>
          )}
        </View>

        <View style={{ paddingTop: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                {restaurant.name}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                  marginTop: 2,
                }}
              >
                {restaurant.category} · {restaurant.priceRange}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Feather name='star' size={14} color='#F59E0B' />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                {restaurant.rating}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                ({restaurant.reviews})
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <Feather name='clock' size={12} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {restaurant.deliveryTime}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <Feather
                name='map-pin'
                size={12}
                color={colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {restaurant.distance}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <Feather
                name='shopping-bag'
                size={12}
                color={colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                Min Rs. {restaurant.minOrder}
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
            backgroundColor: colors.primary + '10',
            borderColor: colors.primary + '30',
          },
        ]}
      >
        <View
          style={[
            styles.listBannerIcon,
            { backgroundColor: colors.primary + '20' },
          ]}
        >
          <Feather name='plus-circle' size={20} color={colors.primary} />
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
  const { restaurants, restaurantsState, fetchRestaurants } = useData();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRestaurants(search ? { search } : undefined);
  }, [fetchRestaurants, search]);

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
          backgroundColor: colors.navy,
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
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

          <ListYourRestaurantBanner colors={colors} />

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
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  listBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantBanner: {
    height: 120,
    borderRadius: 10,
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
