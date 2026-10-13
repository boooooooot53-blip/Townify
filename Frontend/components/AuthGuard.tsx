import { router, useSegments, useRootNavigationState } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import axios from 'axios';
import { getAccessToken } from '@/utils/storage';



const PUBLIC_ROUTES = [
  'login',
  'register',
  'forgot-password',
  'verify-otp',
  'reset-password',
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { user, isLoading } = useAuth();


  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const currentRoute = segments[0] ?? '';
  const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);
  const isAuthenticated = !!user;
  const fetchUser = async () => {
    const token =  await getAccessToken();
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const sucess=response.data.statusCode;
   if(sucess==200){
    const userStatus=response.data.data.user.approved;
    if(!userStatus){
       router.replace('/wait-approval');
    }
     if(response.data.data.user.role=='admin' || response.data.data.user.role=='superadmin'){
          router.replace('/admin');
        }
   }
  }
  useEffect(() => {
    if (!navigationState?.key) return;
    if (isLoading) return;





    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }
  
    if (isAuthenticated && isPublicRoute) {
        fetchUser()
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isPublicRoute, navigationState?.key]);

  if (!navigationState?.key || isLoading) {
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

  if (!isAuthenticated && !isPublicRoute) {
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

  return <>{children}</>;
}
