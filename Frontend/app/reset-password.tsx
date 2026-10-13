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
import { resetPassword } from '@/api/auth';
import { useColors } from '@/hooks/useColors';
import { Button, Input } from '@/components/ThemedComponents';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email, code } = useLocalSearchParams<{
    email: string;
    code: string;
  }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const requirements = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
  ];

  function validate() {
    const e: Record<string, string> = {};
    if (!password) e.password = 'Please enter a new password.';
    else if (password.length < 6)
      e.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) e.confirm = 'Please confirm your password.';
    else if (password !== confirmPassword)
      e.confirm = 'Passwords do not match.';
    if (!email) e.email = 'Email is missing. Go back and request a new code.';
    if (!code) e.code = 'Reset code is missing. Go back and verify your code.';
    return e;
  }

  async function handleReset() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await resetPassword(email, code, password);
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } catch (err) {
      setErrors({
        password: getErrorMessage(
          err,
          'Failed to reset password. Please try again.',
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
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
        {!done && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name='arrow-left' size={20} color='#FFFFFF' />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.headerTitle}>Set New Password</Text>
          <Text style={styles.headerSubtitle}>Choose a strong password</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: bottomInset + 32,
          gap: 24,
          flexGrow: 1,
        }}
      >
        {done ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              paddingVertical: 40,
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.success + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name='check-circle' size={48} color={colors.success} />
            </View>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                  textAlign: 'center',
                }}
              >
                Password Reset!
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                Your password has been successfully updated. You can now sign in
                with your new password.
              </Text>
            </View>
            <Button
              title='Sign In Now'
              onPress={() => router.replace('/login')}
              size='lg'
              style={{ width: '100%' }}
            />
          </View>
        ) : (
          <>
            <View style={{ alignItems: 'center', paddingTop: 8 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Feather name='key' size={32} color={colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                  textAlign: 'center',
                  lineHeight: 21,
                }}
              >
                Create a new password for{' '}
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: 'Inter_500Medium',
                  }}
                >
                  {email}
                </Text>
              </Text>
            </View>

            {errors.email || errors.code ? (
              <View
                style={{
                  backgroundColor: colors.destructive + '18',
                  borderRadius: 10,
                  padding: 12,
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Feather
                  name='alert-circle'
                  size={16}
                  color={colors.destructive}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: colors.destructive,
                    fontFamily: 'Inter_400Regular',
                  }}
                >
                  {errors.email || errors.code}
                </Text>
              </View>
            ) : null}

            <Input
              label='New Password'
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((e) => ({ ...e, password: '' }));
              }}
              placeholder='Minimum 6 characters'
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={
                <Feather name='lock' size={16} color={colors.mutedForeground} />
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

            {password.length > 0 && (
              <View
                style={{
                  gap: 6,
                  backgroundColor: colors.muted,
                  borderRadius: colors.radius,
                  padding: 12,
                }}
              >
                {requirements.map((req, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Feather
                      name={req.met ? 'check-circle' : 'circle'}
                      size={14}
                      color={req.met ? colors.success : colors.mutedForeground}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Inter_400Regular',
                        color: req.met
                          ? colors.success
                          : colors.mutedForeground,
                      }}
                    >
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Input
              label='Confirm Password'
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setErrors((e) => ({ ...e, confirm: '' }));
              }}
              placeholder='Re-enter your password'
              secureTextEntry={!showConfirm}
              error={errors.confirm}
              leftIcon={
                <Feather name='lock' size={16} color={colors.mutedForeground} />
              }
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Feather
                    name={showConfirm ? 'eye-off' : 'eye'}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              }
            />

            <Button
              title='Reset Password'
              onPress={handleReset}
              loading={loading}
              disabled={!password || !confirmPassword}
              size='lg'
            />
          </>
        )}
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
