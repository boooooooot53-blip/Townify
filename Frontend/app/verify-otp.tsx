import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/axios';
import { verifyOtp, forgotPassword } from '@/api/auth';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ThemedComponents';

export default function VerifyOtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleChange(text: string, index: number) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOtp(email, code, 'password_reset');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace({ pathname: '/reset-password', params: { email, code } });
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired code. Please try again.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg('');
    setError('');
    try {
      await forgotPassword(email);
      setResendMsg('A new code has been sent to your email.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend code.'));
    } finally {
      setResending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ backgroundColor: colors.navy, paddingTop: topInset + 12, paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Verify Code</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{email}</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: bottomInset + 32, gap: 24, flexGrow: 1 }}
      >
        {/* Icon + text */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Feather name="mail" size={36} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground, fontFamily: 'Inter_700Bold', textAlign: 'center' }}>
            Check your email
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21, marginTop: 8 }}>
            We sent a 6-digit code to{'\n'}
            <Text style={{ fontWeight: '700', color: colors.foreground }}>{email}</Text>
          </Text>
        </View>

        {/* OTP input boxes */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(r) => { inputs.current[index] = r; }}
              value={digit}
              onChangeText={(t) => handleChange(t, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              style={{
                width: 48,
                height: 56,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: digit ? colors.primary : colors.border,
                backgroundColor: colors.card,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: '700',
                color: colors.foreground,
              }}
            />
          ))}
        </View>

        {/* Error */}
        {error ? (
          <View style={{ backgroundColor: colors.destructive + '18', borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.destructive, fontFamily: 'Inter_400Regular' }}>{error}</Text>
          </View>
        ) : null}

        {/* Resend success */}
        {resendMsg ? (
          <View style={{ backgroundColor: colors.success + '18', borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.success, fontFamily: 'Inter_400Regular' }}>{resendMsg}</Text>
          </View>
        ) : null}

        <Button title="Verify Code" onPress={handleVerify} loading={loading} size="lg" />

        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
              Didn't receive it?{' '}
              <Text style={{ color: resending ? colors.mutedForeground : colors.primary, fontFamily: 'Inter_500Medium' }}>
                {resending ? 'Sending...' : 'Resend Code'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular', marginTop: 2 },
});