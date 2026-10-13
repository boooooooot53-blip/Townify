import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logout } from '@/api/auth';
import { useColors } from '@/hooks/useColors';

export default function WaitingApprovalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [loggingOut, setLoggingOut] = useState(false);
  
  async function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);

              await logout();

              // Change this route if your login screen has a different path.
              router.replace('/login');
            } catch (error) {
              // Your logout() already clears tokens in finally,
              // so navigation should still happen.
              router.replace('/login');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      {/* Main content */}
      <View style={styles.content}>
        {/* App icon / waiting icon */}
        <View
          style={[
            styles.iconOuter,
            {
              backgroundColor: colors.primary + '12',
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.primary + '20',
              },
            ]}
          >
            <Feather
              name="clock"
              size={42}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            {
              color: colors.foreground,
            },
          ]}
        >
          Waiting for Approval
        </Text>

        {/* Description */}
        <Text
          style={[
            styles.description,
            {
              color: colors.mutedForeground,
            },
          ]}
        >
          Your account has been successfully created and is currently
          waiting for approval.
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.mutedForeground,
            },
          ]}
        >
          Our team will review your account. You will be able to use the
          app once your account has been approved.
        </Text>

        {/* Waiting status card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: colors.primary + '15',
              },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
          </View>

          <View style={styles.statusContent}>
            <Text
              style={[
                styles.statusTitle,
                {
                  color: colors.foreground,
                },
              ]}
            >
              Approval Pending
            </Text>

            <Text
              style={[
                styles.statusText,
                {
                  color: colors.mutedForeground,
                },
              ]}
            >
              Please wait while your account is being reviewed.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottom}>
        <Text
          style={[
            styles.logoutHint,
            {
              color: colors.mutedForeground,
            },
          ]}
        >
          You can logout and return later.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          disabled={loggingOut}
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.destructive,
              opacity: loggingOut ? 0.7 : 1,
            },
          ]}
        >
          {loggingOut ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Feather
              name="log-out"
              size={18}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.logoutText}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconOuter: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 14,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: 380,
    marginBottom: 8,
  },

  statusCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 3,
  },

  statusText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },

  bottom: {
    width: '100%',
    alignItems: 'center',
  },

  logoutHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 10,
  },

  logoutButton: {
    width: '100%',
    maxWidth: 420,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});