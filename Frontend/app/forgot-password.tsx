import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
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
import { forgotPassword } from '@/api/auth';
import { useColors } from '@/hooks/useColors';
import { Button, Input } from '@/components/ThemedComponents';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(initialEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  async function handleSend() {
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
      await forgotPassword(email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.push({ pathname: '/verify-otp', params: { email: email.trim() } });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send reset code.'));
    } finally {
      setLoading(false);
    }
  }

  const isWeb = Platform.OS === 'web';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isWeb ? (colors.muted + '25') : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header (native only or web back button) */}
      {!isWeb ? (
        <View
          style={{
            backgroundColor: colors.navy,
            paddingTop: topInset + 12,
            paddingHorizontal: 20,
            paddingBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name='arrow-left' size={20} color='#FFFFFF' />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <Text style={styles.headerSubtitle}>Reset your account access</Text>
          </View>
        </View>
      ) : null}

      <ScrollView
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            padding: 24,
            paddingBottom: bottomInset + 32,
            gap: 24,
            flexGrow: 1,
          },
          isWeb && {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 48,
            paddingHorizontal: 20,
          },
        ]}
      >
        <View
          style={[
            { width: '100%' },
            isWeb && {
              maxWidth: 480,
              backgroundColor: colors.card,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: colors.border,
              padding: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.08,
              shadowRadius: 28,
            },
          ]}
        >
          {isWeb ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Feather name='arrow-left' size={20} color={colors.foreground} />
            </TouchableOpacity>
          ) : null}
        {/* Icon */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Feather name='lock' size={36} color={colors.primary} />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: colors.foreground,
              fontFamily: 'Inter_700Bold',
              textAlign: 'center',
            }}
          >
            Reset your password
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
              textAlign: 'center',
              lineHeight: 21,
              marginTop: 8,
            }}
          >
            Enter the email linked to your account and we'll send you a reset
            code.
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View
            style={{
              backgroundColor: colors.destructive + '18',
              borderRadius: colors.radius,
              padding: 12,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
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
              {error}
            </Text>
          </View>
        ) : null}

        {/* Email Input */}
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
          leftIcon={
            <Feather name='mail' size={16} color={colors.mutedForeground} />
          }
        />

        <Button
          title='Send Reset Code'
          onPress={handleSend}
          loading={loading}
          size='lg'
        />

        <View
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Remember your password?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                fontWeight: '600',
                fontFamily: 'Inter_600SemiBold',
              }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
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

