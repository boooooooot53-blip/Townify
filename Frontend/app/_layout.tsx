import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const isWeb = Platform.OS === 'web';

  return (
    <AuthGuard>
      <View style={isWeb ? { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center', marginHorizontal: 'auto' } : { flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='login' options={{ headerShown: false }} />
        <Stack.Screen name='register' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen
          name='new-complaint'
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name='complaint-detail'
          options={{ headerShown: false }}
        />
        <Stack.Screen name='worker-profile' options={{ headerShown: false }} />
        <Stack.Screen name='wait-approval' options={{ headerShown: false }} />
        <Stack.Screen name='admin' options={{ headerShown: false }} />
        {/* <Stack.Screen name='admin/users' options={{ headerShown: false }} /> */}
        <Stack.Screen
          name='service-request'
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name='quotations' options={{ headerShown: false }} />
        <Stack.Screen name='chat-room' options={{ headerShown: false }} />

        <Stack.Screen
          name='restaurant-detail'
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name='create-restaurant'
          options={{ presentation: 'modal', headerShown: false }}
        />

        <Stack.Screen
          name='manage-restaurant'
          options={{ headerShown: false }}
        />
        <Stack.Screen name='notifications' options={{ headerShown: false }} />
        <Stack.Screen
          name='edit-profile'
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name='forgot-password' options={{ headerShown: false }} />
        <Stack.Screen name='admin-changePassword' options={{ headerShown: false }} />
        <Stack.Screen name='verify-otp' options={{ headerShown: false }} />
        <Stack.Screen name='reset-password' options={{ headerShown: false }} />
        <Stack.Screen
          name='send-quotation'
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </View>
    </AuthGuard>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DataProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </DataProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
