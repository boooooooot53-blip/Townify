import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { changePassword } from '@/api/auth';
import { useColors } from '@/hooks/useColors';

export default function ChangePasswordScreen() {
  const colors = useColors();

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const styles = createStyles(colors);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert(
        'Required',
        'Please enter your current password.',
      );
      return;
    }

    if (!newPassword) {
      Alert.alert(
        'Required',
        'Please enter your new password.',
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        'Invalid Password',
        'Your new password must be at least 8 characters long.',
      );
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert(
        'Invalid Password',
        'Your new password must be different from your current password.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Passwords Do Not Match',
        'Please make sure your new passwords match.',
      );
      return;
    }

    try {
      setLoading(true);

      await changePassword(
        currentPassword,
        newPassword,
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Password Changed',
        'Your password has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error: any) {
      console.error(
        'Change password error:',
        error,
      );

      const message =
        error?.response?.data?.message ||
        'Unable to change your password. Please try again.';

      Alert.alert('Change Password Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather
              name="arrow-left"
              size={21}
              color="#fff"
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Change Password
            </Text>

            <Text style={styles.subtitle}>
              Keep your account secure
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Feather
              name="lock"
              size={20}
              color="#fff"
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Security Icon */}
          <View style={styles.securityContainer}>
            <View style={styles.securityIcon}>
              <Feather
                name="shield"
                size={30}
                color={colors.primary}
              />
            </View>

            <Text style={styles.securityTitle}>
              Update your password
            </Text>

            <Text style={styles.securityText}>
              Choose a strong password that you
              don't use on other websites or apps.
            </Text>
          </View>

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Current Password
            </Text>

            <View style={styles.inputContainer}>
              <Feather
                name="lock"
                size={18}
                color={colors.mutedForeground}
              />

              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={
                  colors.mutedForeground
                }
                secureTextEntry={!showCurrent}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable
                onPress={() =>
                  setShowCurrent(
                    !showCurrent,
                  )
                }
                hitSlop={10}
              >
                <Feather
                  name={
                    showCurrent
                      ? 'eye-off'
                      : 'eye'
                  }
                  size={19}
                  color={
                    colors.mutedForeground
                  }
                />
              </Pressable>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              New Password
            </Text>

            <View style={styles.inputContainer}>
              <Feather
                name="key"
                size={18}
                color={colors.mutedForeground}
              />

              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={
                  colors.mutedForeground
                }
                secureTextEntry={!showNew}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable
                onPress={() =>
                  setShowNew(!showNew)
                }
                hitSlop={10}
              >
                <Feather
                  name={
                    showNew
                      ? 'eye-off'
                      : 'eye'
                  }
                  size={19}
                  color={
                    colors.mutedForeground
                  }
                />
              </Pressable>
            </View>

            <Text style={styles.hint}>
              Minimum 8 characters
            </Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Confirm New Password
            </Text>

            <View style={styles.inputContainer}>
              <Feather
                name="check-circle"
                size={18}
                color={colors.mutedForeground}
              />

              <TextInput
                value={confirmPassword}
                onChangeText={
                  setConfirmPassword
                }
                placeholder="Confirm new password"
                placeholderTextColor={
                  colors.mutedForeground
                }
                secureTextEntry={!showConfirm}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable
                onPress={() =>
                  setShowConfirm(
                    !showConfirm,
                  )
                }
                hitSlop={10}
              >
                <Feather
                  name={
                    showConfirm
                      ? 'eye-off'
                      : 'eye'
                  }
                  size={19}
                  color={
                    colors.mutedForeground
                  }
                />
              </Pressable>
            </View>
          </View>

          {/* Password Rules */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>
              Password requirements
            </Text>

            <PasswordRule
              valid={newPassword.length >= 8}
              text="At least 8 characters"
              colors={colors}
            />

            <PasswordRule
              valid={
                newPassword !== '' &&
                newPassword !==
                  currentPassword
              }
              text="Different from current password"
              colors={colors}
            />

            <PasswordRule
              valid={
                newPassword !== '' &&
                newPassword ===
                  confirmPassword
              }
              text="Passwords match"
              colors={colors}
            />
          </View>

          {/* Button */}
          <Pressable
            disabled={loading}
            onPress={handleChangePassword}
            style={({ pressed }) => [
              styles.button,
              pressed &&
                !loading &&
                styles.buttonPressed,
              loading &&
                styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                color="#fff"
              />
            ) : (
              <>
                <Feather
                  name="lock"
                  size={18}
                  color="#fff"
                />

                <Text style={styles.buttonText}>
                  Change Password
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordRule({
  valid,
  text,
  colors,
}: {
  valid: boolean;
  text: string;
  colors: any;
}) {
  return (
    <View style={ruleStyles.row}>
      <Feather
        name={
          valid
            ? 'check-circle'
            : 'circle'
        }
        size={15}
        color={
          valid
            ? colors.success
            : colors.mutedForeground
        }
      />

      <Text
        style={[
          ruleStyles.text,
          {
            color: valid
              ? colors.success
              : colors.mutedForeground,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const ruleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  text: {
    marginLeft: 8,
    fontSize: 12,
  },
});

const createStyles = (
  colors: ReturnType<typeof useColors>,
) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    keyboard: {
      flex: 1,
    },

    header: {
      backgroundColor: colors.navy,
      paddingHorizontal: 18,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerText: {
      flex: 1,
      marginLeft: 12,
    },

    title: {
      color: '#fff',
      fontFamily: 'Inter_700Bold',
      fontSize: 20,
    },

    subtitle: {
      color: 'rgba(255,255,255,0.7)',
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginTop: 2,
    },

    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    content: {
      padding: 20,
      paddingBottom: 40,
    },

    securityContainer: {
      alignItems: 'center',
      marginBottom: 28,
    },

    securityIcon: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: `${colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },

    securityTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_700Bold',
      fontSize: 18,
    },

    securityText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: 330,
    },

    inputGroup: {
      marginBottom: 18,
    },

    label: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      marginBottom: 7,
    },

    inputContainer: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },

    input: {
      flex: 1,
      color: colors.foreground,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      marginLeft: 10,
    },

    hint: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      marginTop: 5,
    },

    rulesCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 15,
      marginBottom: 22,
    },

    rulesTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
    },

    button: {
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    buttonPressed: {
      opacity: 0.8,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: '#fff',
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },
  });