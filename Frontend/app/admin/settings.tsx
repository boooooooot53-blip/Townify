import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

export default function AdminSettingsScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [newWorkers, setNewWorkers] = useState(true);
  const [newComplaints, setNewComplaints] = useState(true);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await logout();
        router.replace('/login');
      }
      return;
    }

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
            await logout();
            router.replace('/login');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingBottom: Platform.OS === 'web' ? 120 : 35 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage your admin preferences
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Feather name="settings" size={21} color="#fff" />
          </View>
        </View>



        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.card}>
        

          <SettingRow
            icon="lock"
            title="Change Password"
            subtitle="Update your admin password"
            colors={colors}
            onPress={() => router.push('/admin-changePassword')}
          />

         
        </View>



        <Pressable
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Feather
            name="log-out"
            size={18}
            color={colors.destructive}
          />

          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.version}>
          Admin Panel • Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingSwitch({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: `${colors.primary}15`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={17} color={colors.primary} />
      </View>

      <View style={{ flex: 1, marginLeft: 11 }}>
        <Text
          style={{
            color: colors.foreground,
            fontFamily: 'Inter_600SemiBold',
            fontSize: 13,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
            fontSize: 11,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.border,
          true: colors.primary,
        }}
        thumbColor="#fff"
      />
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  colors,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: `${colors.primary}15`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather
          name={icon}
          size={17}
          color={colors.primary}
        />
      </View>

      <View
        style={{
          flex: 1,
          marginLeft: 11,
        }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontFamily: 'Inter_600SemiBold',
            fontSize: 13,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
            fontSize: 11,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <Feather
        name="chevron-right"
        size={18}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}

function Divider({
  colors,
}: {
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 13,
      }}
    />
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      paddingBottom: 35,
    },
    header: {
      backgroundColor: colors.navy,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      color: '#fff',
      fontFamily: 'Inter_700Bold',
      fontSize: 24,
    },
    subtitle: {
      color: 'rgba(255,255,255,.72)',
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      marginTop: 4,
    },
    headerIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255,255,255,.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_700Bold',
      fontSize: 16,
      marginHorizontal: 18,
      marginTop: 22,
      marginBottom: 11,
    },
    card: {
      marginHorizontal: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 15,
      padding: 15,
    },
    logoutButton: {
      marginHorizontal: 18,
      marginTop: 25,
      height: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${colors.destructive}45`,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    logoutText: {
      color: colors.destructive,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },
    version: {
      textAlign: 'center',
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      marginTop: 18,
    },
  });