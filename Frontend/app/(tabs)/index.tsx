import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/axios';
import { createSOS } from '@/api/sos';
import { getCurrentPickedLocation, toApiLocation } from '@/utils/location';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Badge, Card, SectionHeader } from '@/components/ThemedComponents';

const SERVICE_CATEGORIES = [
  {
    id: 'electrical',
    label: 'Electrical',
    icon: 'zap' as const,
    color: '#F59E0B',
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    icon: 'droplet' as const,
    color: '#3B82F6',
  },
  {
    id: 'carpentry',
    label: 'Carpentry',
    icon: 'tool' as const,
    color: '#8B5CF6',
  },
  {
    id: 'ac_repair',
    label: 'AC Repair',
    icon: 'wind' as const,
    color: '#06B6D4',
  },
  {
    id: 'painting',
    label: 'Painting',
    icon: 'edit-2' as const,
    color: '#10B981',
  },
  {
    id: 'pest_control',
    label: 'Pest Control',
    icon: 'shield' as const,
    color: '#EF4444',
  },
  {
    id: 'restaurants',
    label: 'Food Order',
    icon: 'coffee' as const,
    color: '#F97316',
  },
  {
    id: 'complaints',
    label: 'Complaints',
    icon: 'alert-circle' as const,
    color: '#6366F1',
  },
];

function ResidentHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    complaints,
    serviceRequests,
    unreadNotificationsCount,
    complaintsState,
    serviceRequestsState,
    fetchComplaints,
    fetchServiceRequests,
    fetchNotifications,
  } = useData();
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchServiceRequests();
    fetchNotifications();
  }, [fetchComplaints, fetchServiceRequests, fetchNotifications]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const pendingComplaints = complaints.filter(
    (c) => c.status !== 'resolved',
  ).length;
  const activeRequests = serviceRequests.filter(
    (r) => r.status !== 'completed',
  ).length;

  function handleSOSPress() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    setSosModalVisible(true);
  }

  async function confirmSOS() {
    setSosLoading(true);
    try {
      const picked = await getCurrentPickedLocation();

      await createSOS({
        emergencyType: 'other',
        description: 'Emergency SOS activated from Townify app',
        location: toApiLocation(picked),
      });

      setSosModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      Alert.alert(
        'SOS Activated',
        'Emergency services have been notified. Help is on the way.',
        [{ text: 'OK' }],
      );
      await fetchNotifications();
    } catch (err) {
      Alert.alert(
        'SOS Failed',
        getErrorMessage(err, 'Could not send SOS alert.'),
      );
    } finally {
      setSosLoading(false);
    }
  }

  function handleServicePress(id: string) {
    Haptics.selectionAsync().catch(() => {});
    if (id === 'restaurants') {
      router.push("/restaurants");
    } else if (id === 'complaints') {
      router.push('/(tabs)/complaints');
    } else {
      router.push({
        pathname: '/service-request',
        params: { category: id },
      });
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '⛅' };
    return { text: 'Good evening', emoji: '🌙' };
  };
  const greeting = getGreeting();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 80 : 20,
          paddingHorizontal: 20,
          paddingTop: topInset + 12,
          gap: 16,
        }}
      >
        {/* Header: Premium Aesthetic */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 16 }}>{greeting.emoji}</Text>
              <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {greeting.text}
              </Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.foreground, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 }}>
              Hi, {user?.name?.split(' ')[0] ?? 'there'}!
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Feather name='bell' size={20} color={colors.foreground} />
              {unreadNotificationsCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive, top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Feather name='user' size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          <Feather name='map-pin' size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
            {user?.location ?? 'Lahore, Pakistan'}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
          {/* Active Requests (Hero Card Style) */}
          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: colors.primary, 
              borderRadius: colors.radius, 
              padding: 20, 
              justifyContent: 'center',
              minHeight: 120,
              overflow: 'hidden',
              shadowColor: colors.primary, 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: 0.2, 
              shadowRadius: 8, 
              elevation: 4 
            }}
            onPress={() => router.navigate('/(tabs)/services')}
            activeOpacity={0.8}
          >
            <Feather 
              name="clock" 
              size={100} 
              color="rgba(255,255,255,0.08)" 
              style={{ position: 'absolute', bottom: -20, right: -20, zIndex: 0 }} 
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, zIndex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="clock" size={16} color="#FFF" />
              </View>
              <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                {activeRequests}
              </Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Inter_500Medium', zIndex: 1 }}>
              Active Requests
            </Text>
          </TouchableOpacity>

          {/* Complaints (Standard Card Style) */}
          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: colors.card, 
              borderRadius: colors.radius, 
              padding: 20, 
              justifyContent: 'center',
              minHeight: 120,
              overflow: 'hidden',
              shadowColor: "#000", 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: 0.04, 
              shadowRadius: 8, 
              elevation: 2 
            }}
            onPress={() => router.navigate('/(tabs)/complaints')}
            activeOpacity={0.8}
          >
            <Feather 
              name="alert-circle" 
              size={100} 
              color={colors.warning + '10'} 
              style={{ position: 'absolute', bottom: -20, right: -20, zIndex: 0 }} 
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, zIndex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.warning + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="alert-circle" size={16} color={colors.warning} />
              </View>
              <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                {pendingComplaints}
              </Text>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_500Medium', zIndex: 1 }}>
              Complaints
            </Text>
          </TouchableOpacity>
        </View>

        {(complaintsState.loading || serviceRequestsState.loading) &&
        complaints.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size='large' color={colors.primary} />
          </View>
        ) : null}

        {(complaintsState.error || serviceRequestsState.error) && (
          <View style={{ padding: 16, backgroundColor: colors.destructive + '15', borderRadius: colors.radius, marginBottom: 24 }}>
            <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium' }}>
              {complaintsState.error || serviceRequestsState.error}
            </Text>
          </View>
        )}

        {/* SOS Alert Strip */}
        <TouchableOpacity
          onPress={handleSOSPress}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.destructive + '10',
            borderWidth: 1,
            borderColor: colors.destructive + '30',
            borderRadius: colors.radius,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.destructive + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Feather name='alert-octagon' size={20} color={colors.destructive} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.destructive, fontFamily: 'Inter_600SemiBold', marginBottom: 2 }}>Emergency SOS</Text>
            <Text style={{ fontSize: 13, color: colors.destructive, opacity: 0.8, fontFamily: 'Inter_400Regular' }}>Tap to alert emergency services</Text>
          </View>
          <Feather name='chevron-right' size={20} color={colors.destructive} opacity={0.5} />
        </TouchableOpacity>

        {/* Service Categories */}
        <View style={{ marginBottom: 24 }}>
          <SectionHeader
            title='Quick Services'
            subtitle='What do you need today?'
          />
          <View style={styles.servicesGrid}>
            {SERVICE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleServicePress(cat.id)}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    padding: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                ]}
                activeOpacity={0.8}
              >
                <Feather name={cat.icon} size={28} color={colors.primary} />
                <Text
                  style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontWeight: '900', fontSize: 11, textAlign: 'center', marginTop: 4 }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>



        {/* Recent Activity */}
        <View style={{ marginBottom: 24 }}>
          <SectionHeader
            title='Recent Activity'
            action='See All'
            onAction={() => router.push('/(tabs)/complaints')}
          />
          {complaints.slice(0, 2).map((comp) => (
            <TouchableOpacity
              key={comp.id}
              onPress={() =>
                router.push({
                  pathname: '/complaint-detail',
                  params: { id: comp.id },
                })
              }
            >
              <Card style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: colors.foreground,
                        fontFamily: 'Inter_600SemiBold',
                        marginBottom: 4,
                      }}
                    >
                      {comp.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.mutedForeground,
                        fontFamily: 'Inter_400Regular',
                      }}
                      numberOfLines={2}
                    >
                      {comp.description}
                    </Text>
                  </View>
                  <Badge
                    label={comp.status.replace('_', ' ')}
                    variant={
                      comp.status === 'resolved'
                        ? 'success'
                        : comp.status === 'in_progress'
                          ? 'info'
                          : comp.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                    }
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
          {complaints.length === 0 && (
            <View
              style={{
                alignItems: 'center',
                padding: 24,
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
              }}
            >
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                }}
              >
                No recent activity
              </Text>
            </View>
          )}
        </View>


      </ScrollView>



      {/* SOS Confirmation Modal */}
      <Modal
        visible={sosModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderRadius: colors.radius * 2 },
            ]}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.destructive + '18',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Feather
                name='alert-octagon'
                size={36}
                color={colors.destructive}
              />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.foreground,
                fontFamily: 'Inter_700Bold',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Activate SOS?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
                textAlign: 'center',
                lineHeight: 21,
                marginBottom: 24,
              }}
            >
              This will immediately alert emergency services and share your
              current location.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Pressable
                onPress={() => setSosModalVisible(false)}
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.secondary, flex: 1 },
                ]}
              >
                <Text
                  style={{
                    color: colors.secondaryForeground,
                    fontWeight: '600',
                    fontFamily: 'Inter_600SemiBold',
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmSOS}
                disabled={sosLoading}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.destructive,
                    flex: 1,
                    opacity: sosLoading ? 0.7 : 1,
                  },
                ]}
              >
                {sosLoading ? (
                  <ActivityIndicator color='#fff' />
                ) : (
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: '700',
                      fontFamily: 'Inter_700Bold',
                    }}
                  >
                    CONFIRM SOS
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function WorkerHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  
  const { user } = useAuth();
  const { serviceRequests, unreadNotificationsCount, fetchServiceRequests, fetchNotifications } = useData();

  useEffect(() => {
    fetchServiceRequests();
    fetchNotifications();
  }, [fetchServiceRequests, fetchNotifications]);

  const profession = user?.profession || 'Worker';
  const myId = user?.id;

  const myCategories = user?.categories || [];

  const availableJobs = serviceRequests.filter(
    (r) =>
      r.userId !== myId &&
      (r.status === 'pending' || r.status === 'quoted') &&
      myCategories.includes(r.category)
  ).length;

  const activeProjects = serviceRequests.filter(
    (r) => 
      r.status !== 'completed' &&
      r.quotations?.some(q => q.workerId === myId && q.status === 'accepted')
  ).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '⛅' };
    return { text: 'Good evening', emoji: '🌙' };
  };
  const greeting = getGreeting();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: topInset + 12, gap: 16, maxWidth: 800, alignSelf: 'center', width: '100%' }}>
        
        {/* Header: Premium Aesthetic */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 16 }}>{greeting.emoji}</Text>
              <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {greeting.text}
              </Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.foreground, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 }}>
              Hi, {user?.name?.split(' ')[0] ?? 'there'}!
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Feather name='bell' size={20} color={colors.foreground} />
              {unreadNotificationsCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive, top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Feather name='user' size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <Feather name='tool' size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' }}>
            {profession} Dashboard
          </Text>
        </View>

        {/* Bento Grid */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
          {/* Left Hero Card (Tall) */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/services')}
            activeOpacity={0.9}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              padding: 20,
              justifyContent: 'space-between',
              minHeight: 220,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="briefcase" size={24} color="#FFF" />
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 4 }}>
                Open Jobs
              </Text>
              <Text style={{ color: '#FFF', fontSize: 42, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                {availableJobs}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 4 }}>
                Available in your area
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right Stacked Cards */}
          <View style={{ flex: 1, gap: 16 }}>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/services')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                padding: 16,
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F59E0B18', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="tool" size={16} color="#F59E0B" />
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                  {activeProjects}
                </Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                Active Projects
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                padding: 16,
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B98118', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="check-circle" size={16} color="#10B981" />
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                  {user?.workerProfile?.completedJobs ?? 0}
                </Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                Completed Jobs
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Actions / Full Width */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/services')}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: colors.radius,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Feather name='search' size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold', marginBottom: 2 }}>Find New Jobs</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Browse the job board and submit quotes.</Text>
          </View>
          <Feather name='chevron-right' size={20} color={colors.mutedForeground} opacity={0.5} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  if (user?.role === 'worker') {
    return <WorkerHome />;
  }
  return <ResidentHome />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    textAlign: 'center',
  },
  sosButton: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sosInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sosTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  sosSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 28,
    alignItems: 'center',
  },
  modalBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
