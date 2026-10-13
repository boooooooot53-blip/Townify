import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View, useColorScheme, Text } from 'react-native';

import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { useSocketNotifications } from '@/hooks/useSocketNotifications';

function TabBadge({ count }: { count: number }) {
  const colors = useColors();
  if (count === 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: colors.destructive,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  useSocketNotifications();

  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  const { conversations } = useData();
  const unreadChats = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const isWorker = user?.role === 'worker';

  return (
    <AuthGuard>
      <View style={isWeb ? { flex: 1, width: '100%', maxWidth: 960, marginHorizontal: 'auto' } : { flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.mutedForeground,
            headerShown: false,
            tabBarStyle: {
              backgroundColor: isIOS ? 'transparent' : colors.tabBar,
              borderTopWidth: 0,
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              ...(isWeb ? {
                maxWidth: 680,
                width: '92%',
                marginHorizontal: 'auto',
                borderRadius: 20,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: colors.border,
                height: 64,
                paddingBottom: 8,
                paddingTop: 8,
                shadowOpacity: 0.12,
                shadowRadius: 16,
              } : {}),
            },

            tabBarHideOnKeyboard: true,
            tabBarLabelStyle: {
              fontFamily: 'Inter_500Medium',
              fontSize: 10,
            },
            tabBarBackground: () =>
              isIOS ? (
                <BlurView
                  intensity={100}
                  tint={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
              ) : isWeb ? (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: colors.tabBar, borderRadius: 20 },
                  ]}
                />
              ) : null,
          }}
        >
        <Tabs.Screen
          name='index'
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name='house.fill' tintColor={color} size={22} />
              ) : (
                <Feather name='home' size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name='services'
          options={{
            title: 'Services',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView
                  name='wrench.and.screwdriver.fill'
                  tintColor={color}
                  size={22}
                />
              ) : (
                <Feather name='tool' size={22} color={color} />
              ),
          }}
        />

        {/* ── Restaurants tab ───────────────────────────────────────── */}
        <Tabs.Screen
          name='restaurants'
          options={{
            title: 'Restaurants',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name='fork.knife' tintColor={color} size={22} />
              ) : (
                <Feather name='coffee' size={22} color={color} />
              ),
          }}
        />

        <Tabs.Screen
          name='complaints'
          options={{
            href: isWorker ? null : '/complaints',
            title: 'Complaints',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView
                  name='exclamationmark.bubble.fill'
                  tintColor={color}
                  size={22}
                />
              ) : (
                <Feather name='alert-circle' size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name='chat'
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <View>
                  <SymbolView
                    name='bubble.left.and.bubble.right.fill'
                    tintColor={color}
                    size={22}
                  />
                  <TabBadge count={unreadChats} />
                </View>
              ) : (
                <View>
                  <Feather name='message-circle' size={22} color={color} />
                  <TabBadge count={unreadChats} />
                </View>
              ),
          }}
        />
        <Tabs.Screen
          name='profile'
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name='person.fill' tintColor={color} size={22} />
              ) : (
                <Feather name='user' size={22} color={color} />
              ),
          }}
        />
      </Tabs>
    </View>
    </AuthGuard>
  );
}
