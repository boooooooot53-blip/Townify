import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ThemedComponents';
import { updateWorkerProfile } from '@/api/workers';
import { mapUser } from '@/utils/mappers';

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.menuIcon,
            {
              backgroundColor: danger
                ? colors.destructive + '18'
                : colors.primary + '18',
            },
          ]}
        >
          <Feather
            name={icon as any}
            size={18}
            color={danger ? colors.destructive : colors.primary}
          />
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            color: danger ? colors.destructive : colors.foreground,
            fontFamily: 'Inter_400Regular',
            marginLeft: 14,
          }}
        >
          {label}
        </Text>
        {value && (
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
              marginRight: 8,
            }}
          >
            {value}
          </Text>
        )}
        {!danger && (
          <Feather
            name='chevron-right'
            size={18}
            color={colors.mutedForeground}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser: setUser, logout } = useAuth();
  const [ownsRestaurant, setOwnsRestaurant] = React.useState(false);
  const [updatingAvailability, setUpdatingAvailability] = React.useState(false);
  const {
    complaints,
    serviceRequests,
    notifications,
    fetchComplaints,
    fetchServiceRequests,
    fetchNotifications,
  } = useData();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    fetchComplaints();
    fetchServiceRequests();
    fetchNotifications();
    
    // Load setting
    if (user) {
      AsyncStorage.getItem(`ownsRestaurant_${user.id}`).then((val) => {
        if (val === 'true') setOwnsRestaurant(true);
      });
    }
  }, [fetchComplaints, fetchServiceRequests, fetchNotifications, user]);

  const toggleOwnsRestaurant = async (val: boolean) => {
    setOwnsRestaurant(val);
    if (user) {
      await AsyncStorage.setItem(`ownsRestaurant_${user.id}`, val.toString());
    }
  };

  const handleAvailabilityChange = async (status: 'available' | 'busy' | 'offline') => {
    if (!user) return;
    setUpdatingAvailability(true);
    try {
      const latestApiUser = await updateWorkerProfile({
        availability: status,
      });
      setUser(mapUser(latestApiUser));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      Alert.alert('Error', 'Failed to update availability');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  function handleLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        logout().then(() => router.replace('/login'));
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  const resolvedComplaints = complaints.filter(
    (c) => c.status === 'resolved',
  ).length;
  const completedRequests = serviceRequests.filter(
    (r) => r.status === 'completed',
  ).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'web' ? 120 : 90,
        }}
      >
        {/* Profile Header */}
        <View
          style={[
            styles.profileHeader,
            { backgroundColor: colors.navy, paddingTop: topInset + 16 },
          ]}
        >
          <View
            style={[styles.avatarCircle, { backgroundColor: colors.accent }]}
          >
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 90, height: 90, borderRadius: 45 }}
                contentFit='cover'
              />
            ) : (
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  fontFamily: 'Inter_700Bold',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </Text>
            )}
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#FFFFFF',
              fontFamily: 'Inter_700Bold',
              marginTop: 12,
            }}
          >
            {user?.name ?? 'User'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'Inter_400Regular',
              marginTop: 4,
            }}
          >
            {user?.email}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
            }}
          >
            <View
              style={{
                backgroundColor: colors.accent + '30',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 100,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: colors.accent,
                  fontWeight: '600',
                  fontFamily: 'Inter_600SemiBold',
                  textTransform: 'capitalize',
                }}
              >
                {user?.role ?? 'User'}
              </Text>
            </View>
            {user?.location && (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Feather
                  name='map-pin'
                  size={11}
                  color='rgba(255,255,255,0.5)'
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: 'Inter_400Regular',
                  }}
                >
                  {user.location}
                </Text>
              </View>
            )}
          </View>

          {/* Stats */}
          {user?.role !== 'worker' && (
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={[styles.statItem, { backgroundColor: 'transparent', paddingVertical: 10 }]}
                onPress={() => router.navigate('/(tabs)/complaints')}
                activeOpacity={0.7}
              >
                <Text style={styles.statNum}>{complaints.length}</Text>
                <Text style={styles.statLbl}>Complaints</Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              />
              <TouchableOpacity
                style={[styles.statItem, { backgroundColor: 'transparent', paddingVertical: 10 }]}
                onPress={() => router.navigate('/(tabs)/services')}
                activeOpacity={0.7}
              >
                <Text style={styles.statNum}>{serviceRequests.length}</Text>
                <Text style={styles.statLbl}>Requests</Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              />
              <TouchableOpacity
                style={[styles.statItem, { backgroundColor: 'transparent', paddingVertical: 10 }]}
                onPress={() => router.navigate('/(tabs)/complaints')}
                activeOpacity={0.7}
              >
                <Text style={styles.statNum}>{resolvedComplaints}</Text>
                <Text style={styles.statLbl}>Resolved</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 16 }}>
          {/* Worker Availability */}
          {user?.role === 'worker' && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_600SemiBold',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Availability Status
                </Text>
                {updatingAvailability && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
              
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
                {(['available', 'busy', 'offline'] as const).map((status) => {
                  const isActive = user?.workerProfile?.availability === status || (status === 'available' && !user?.workerProfile?.availability);
                  
                  let iconName = 'check-circle';
                  let statusColor = colors.success ?? '#10B981';
                  if (status === 'busy') {
                    iconName = 'clock';
                    statusColor = '#F59E0B';
                  } else if (status === 'offline') {
                    iconName = 'minus-circle';
                    statusColor = colors.mutedForeground;
                  }

                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => handleAvailabilityChange(status)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isActive ? statusColor : colors.border,
                        backgroundColor: isActive ? statusColor + '15' : colors.card,
                      }}
                    >
                      <Feather name={iconName as any} size={18} color={isActive ? statusColor : colors.mutedForeground} />
                      <Text style={{
                        fontSize: 12,
                        fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        color: isActive ? statusColor : colors.mutedForeground,
                        marginTop: 6,
                        textTransform: 'capitalize',
                      }}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          )}

          {/* Account */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
                padding: 16,
                paddingBottom: 8,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Account
            </Text>
            
            {user?.role !== 'worker' && (
              <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.menuIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name="briefcase" size={18} color={colors.primary} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: colors.foreground,
                    fontFamily: 'Inter_400Regular',
                    marginLeft: 14,
                  }}
                >
                  Own a restaurant?
                </Text>
                <Switch 
                  value={ownsRestaurant} 
                  onValueChange={toggleOwnsRestaurant}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            )}

            <MenuItem
              icon='user'
              label='Personal Information'
              onPress={() => router.push('/edit-profile')}
            />
            
          </Card>

          {/* Activity */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
                padding: 16,
                paddingBottom: 8,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Activity
            </Text>
            {user?.role !== 'worker' && (
              <MenuItem
                icon='alert-circle'
                label='My Complaints'
                value={`${complaints.length}`}
                onPress={() => router.push('/(tabs)/complaints')}
              />
            )}
            <MenuItem
              icon='tool'
              label='Service Requests'
              value={`${serviceRequests.length}`}
              onPress={() => router.push('/(tabs)/services')}
            />
            <MenuItem
              icon='bell'
              label='Notifications'
              value={`${notifications.filter((n) => !n.read).length} new`}
              onPress={() => router.push('/notifications')}
            />
          </Card>

          {/* More */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
                padding: 16,
                paddingBottom: 8,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              More
            </Text>
            <MenuItem
              icon='help-circle'
              label='Help & Support'
              onPress={() =>
                Alert.alert('Support', 'Contact us at support@townify.pk')
              }
            />
            <MenuItem
              icon='info'
              label='About Townify'
              onPress={() =>
                Alert.alert(
                  'Townify v1.0',
                  'Community assistance & support app for your neighbourhood.',
                )
              }
            />
          </Card>

          {/* Logout */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <MenuItem
              icon='log-out'
              label='Sign Out'
              onPress={handleLogout}
              danger
            />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    width: '100%',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  statLbl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    alignSelf: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
