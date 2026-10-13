import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === 'web';
    
    return (
        <View style={isWeb ? { flex: 1, width: '100%', maxWidth: 960, marginHorizontal: 'auto' } : { flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.mutedForeground,
                    tabBarStyle: {
                        backgroundColor: colors.card,
                        borderTopColor: colors.border,
                        height: 60 + insets.bottom,
                        paddingTop: 7,
                        paddingBottom: insets.bottom + 8,
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
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.12,
                            shadowRadius: 16,
                            elevation: 8,
                            position: 'absolute',
                        } : {}),
                    },
                    tabBarLabelStyle: {
                        fontFamily: 'Inter_500Medium',
                        fontSize: 10,
                    },
                    tabBarBackground: () =>
                        isWeb ? (
                            <View
                                style={[
                                    StyleSheet.absoluteFill,
                                    { backgroundColor: colors.card, borderRadius: 20 },
                                ]}
                            />
                        ) : null,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Dashboard',
                        tabBarIcon: ({ color, size }) => (
                            <Feather name="grid" color={color} size={size} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="users"
                    options={{
                        title: 'Users',
                        tabBarIcon: ({ color, size }) => (
                            <Feather name="users" color={color} size={size} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="workers"
                    options={{
                        title: 'Workers',
                        tabBarIcon: ({ color, size }) => (
                            <Feather name="tool" color={color} size={size} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="complaints"
                    options={{
                        title: 'Issues',
                        tabBarIcon: ({ color, size }) => (
                            <Feather name="alert-circle" color={color} size={size} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: 'Settings',
                        tabBarIcon: ({ color, size }) => (
                            <Feather name="settings" color={color} size={size} />
                        ),
                    }}
                />
            </Tabs>
        </View>
    );
}