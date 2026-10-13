import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/axios';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ThemedComponents';

import { checkEmail } from '@/api/auth';
import { getAccessToken } from '@/utils/storage';
import axios from 'axios';

type Step = 'choice' | 'email' | 'password';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login,user } = useAuth();

  const [step, setStep] = useState<Step>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
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

  function handleContinueWithEmail() {
    setStep('email');
    setError('');
  }
  async function handleEmailNext() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { exists } = await checkEmail(email.trim());
      if (!exists) {
        router.push({ pathname: '/register', params: { email: email.trim() } });
        return;
      }
      setStep('password');
    } catch (err) {
      console.log('checkEmail error:', JSON.stringify(err, null, 2));
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  }
  async function handlePasswordSubmit() {
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      fetchUser();
      router.replace('/(tabs)');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setError('');
    if (step === 'password') {
      setStep('email');
      setPassword('');
    } else {
      setStep('choice');
      setEmail('');
    }
  }

  const isWeb = Platform.OS === 'web';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isWeb ? (colors.muted + '25') : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          { flexGrow: 1, paddingBottom: bottomInset + 24 },
          isWeb && {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 48,
            paddingHorizontal: 20,
          },
        ]}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            { width: '100%' },
            isWeb && {
              maxWidth: 460,
              backgroundColor: colors.card,
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1.5,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.08,
              shadowRadius: 28,
              elevation: 4,
            },
          ]}
        >
          <View
            style={[
              styles.hero,
              {
                backgroundColor: colors.primary,
                paddingTop: isWeb ? 40 : topInset + 40,
                paddingBottom: isWeb ? 32 : 36,
                borderBottomWidth: 4,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View
              style={[styles.logoContainer, { backgroundColor: colors.secondary, borderWidth: 3, borderColor: colors.border, shadowColor: colors.border, shadowOffset: {width: 3, height: 3}, shadowOpacity: 1, shadowRadius: 0 }]}
            >
              <Feather name='map-pin' size={32} color={colors.foreground} />
            </View>
            <Text style={[styles.appName, {color: '#FFFFFF', fontWeight: '900', textShadowColor: colors.border, textShadowOffset: {width: 2, height: 2}, textShadowRadius: 0}]}>Townify</Text>
            <Text style={[styles.tagline, {color: '#FFFFFF', fontWeight: 'bold'}]}>Your community, connected.</Text>
          </View>

          <View style={{ paddingHorizontal: isWeb ? 32 : 24, paddingTop: 32, paddingBottom: isWeb ? 36 : 0, gap: 20 }}>
          {step === 'choice' && (
            <>
              <View>
                <Text style={[styles.heading, { color: colors.foreground }]}>
                  Get started
                </Text>
                <Text
                  style={[styles.subheading, { color: colors.mutedForeground }]}
                >
                  Sign in to your account or create a new one
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleContinueWithEmail}
                style={[
                  styles.socialBtn,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Feather name='mail' size={20} color='#FFFFFF' />
                <Text style={[styles.socialBtnText, { color: '#FFFFFF' }]}>
                  Continue with Email
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_400Regular',
                  }}
                >
                  New to Townify?
                </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.primary,
                      fontWeight: '600',
                      fontFamily: 'Inter_600SemiBold',
                    }}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'email' && (
            <>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <TouchableOpacity
                  onPress={goBack}
                  style={[styles.backCircle, { backgroundColor: colors.muted }]}
                >
                  <Feather
                    name='arrow-left'
                    size={18}
                    color={colors.foreground}
                  />
                </TouchableOpacity>
                <View>
                  <Text style={[styles.heading, { color: colors.foreground }]}>
                    Enter your email
                  </Text>
                  <Text
                    style={[
                      styles.subheading,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Sign in with your Townify account
                  </Text>
                </View>
              </View>

              {error ? <ErrorBox message={error} colors={colors} /> : null}

              <Input
                label='Email Address'
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError('');
                }}
                placeholder='you@example.com'
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
                autoFocus
                leftIcon={
                  <Feather
                    name='mail'
                    size={16}
                    color={colors.mutedForeground}
                  />
                }
              />

              <Button
                title='Continue'
                onPress={handleEmailNext}
                loading={loading}
                size='lg'
              />
            </>
          )}

          {step === 'password' && (
            <>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <TouchableOpacity
                  onPress={goBack}
                  style={[styles.backCircle, { backgroundColor: colors.muted }]}
                >
                  <Feather
                    name='arrow-left'
                    size={18}
                    color={colors.foreground}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heading, { color: colors.foreground }]}>
                    Enter password
                  </Text>
                  <Text
                    style={[
                      styles.subheading,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {email}
                  </Text>
                </View>
              </View>

              {error ? <ErrorBox message={error} colors={colors} /> : null}

              <Input
                label='Password'
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                placeholder='Enter your password'
                secureTextEntry={!showPassword}
                autoFocus
                leftIcon={
                  <Feather
                    name='lock'
                    size={16}
                    color={colors.mutedForeground}
                  />
                }
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={16}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                }
              />

              <View style={{ alignItems: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/forgot-password',
                      params: { email },
                    })
                  }
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.primary,
                      fontFamily: 'Inter_500Medium',
                    }}
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title='Sign In'
                onPress={handlePasswordSubmit}
                loading={loading}
                size='lg'
              />
            </>
          )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorBox({ message, colors }: { message: string; colors: any }) {
  return (
    <View
      style={{
        backgroundColor: colors.destructive + '18',
        borderRadius: colors.radius,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Feather name='alert-circle' size={16} color={colors.destructive} />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          color: colors.destructive,
          fontFamily: 'Inter_400Regular',
        }}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 48 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  heading: { fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  subheading: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  socialBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1.5,
  },
  socialBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
