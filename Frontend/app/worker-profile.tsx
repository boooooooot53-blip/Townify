import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useData, Worker } from '@/context/DataContext';
import { Badge, Button, Card } from '@/components/ThemedComponents';

function HireModal({
  visible,
  worker,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  worker: Worker | null;
  onConfirm: (message: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const [message, setMessage] = useState('');

  function handleConfirm() {
    const msg =
      message.trim() ||
      `Hi ${worker?.name ?? ''}, I'd like to hire you for ${worker?.profession ?? ''} work. Are you available?`;
    onConfirm(msg);
    setMessage('');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <View
            style={[styles.modalAvatar, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.modalAvatarText}>
              {worker?.name.charAt(0) ?? '?'}
            </Text>
          </View>

          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Hire {worker?.name}?
          </Text>
          <Text
            style={[styles.modalSubtitle, { color: colors.mutedForeground }]}
          >
            A chat request will be sent to the worker. They can accept or
            decline.
          </Text>

          <View style={styles.infoRow}>

            <View
              style={[
                styles.infoChip,
                { backgroundColor: colors.primary + '12' },
              ]}
            >
              <Feather name='star' size={12} color={colors.primary} />
              <Text style={[styles.infoChipText, { color: colors.primary }]}>
                {worker?.rating} rating
              </Text>
            </View>
            <View
              style={[
                styles.infoChip,
                { backgroundColor: colors.primary + '12' },
              ]}
            >
              <Feather name='briefcase' size={12} color={colors.primary} />
              <Text style={[styles.infoChipText, { color: colors.primary }]}>
                {worker?.completedJobs} jobs
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.messageInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={`Hi ${worker?.name ?? ''}, I'd like to hire you...`}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical='top'
              style={{ fontSize: 14, color: colors.foreground, minHeight: 70 }}
            />
          </View>

          <View style={styles.modalBtns}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalBtnSecondary, { borderColor: colors.border }]}
            >
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_500Medium',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.modalBtnPrimary,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather name='send' size={14} color='#FFF' />
              <Text
                style={{
                  color: '#FFF',
                  fontFamily: 'Inter_600SemiBold',
                  marginLeft: 6,
                }}
              >
                Send Request
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function WorkerProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const {
    workers,
    fetchWorkerById,
    sendHireRequest,
    conversations,
    fetchConversations,
  } = useData();
  const { user } = useAuth();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [hireModalVisible, setHireModalVisible] = useState(false);
  const [hireSending, setHireSending] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  const isOwnProfile = user?.id === workerId || user?.role === 'worker';

  // Check existing hire relationship with this specific worker
  const existingHireRequest = conversations.find(
    (c) =>
      c.participantId === workerId &&
      (c.hireStatus === 'pending' || c.hireStatus === 'accepted'),
  );
  const hasPendingRequest = !!existingHireRequest;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const cached = workers.find((w) => w.id === workerId);
      if (cached) setWorker(cached);
      const [fetched] = await Promise.all([
        fetchWorkerById(workerId!),
        fetchConversations(),
      ]);
      if (fetched) setWorker(fetched);
      setLoading(false);
    })();
  }, [workerId]);

  if (loading) {
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

  if (!worker) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>Worker not found</Text>
      </View>
    );
  }

  function handleHirePress() {
    if (isOwnProfile) {
      Alert.alert('Not Allowed', 'Workers cannot send hire requests.');
      return;
    }
    if (existingHireRequest?.hireStatus === 'pending') {
      Alert.alert(
        'Request Already Sent',
        'You already have a pending hire request with this worker. Please wait for them to respond.',
      );
      return;
    }
    if (existingHireRequest?.hireStatus === 'accepted') {
      Alert.alert(
        'Already Hired',
        'You have already hired this worker. Use the existing chat to communicate.',
      );
      return;
    }
    if (!worker?.available) {
      Alert.alert(
        'Unavailable',
        'This worker is currently busy. Please check back later.',
      );
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setHireModalVisible(true);
  }

  async function handleHireConfirm(message: string) {
    if (!worker) return;
    setHireSending(true);
    setHireModalVisible(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      const result = await sendHireRequest(worker.id, message);
      if (result.chatRoomId) {
        router.push({
          pathname: '/chat-room',
          params: { roomId: result.chatRoomId },
        });
      } else {
        router.push('/(tabs)/chat');
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message ?? 'Failed to send hire request. Please try again.',
      );
    } finally {
      setHireSending(false);
    }
  }

  const hireButtonTitle = hireSending
    ? 'Sending Request...'
    : isOwnProfile
      ? 'This is your profile'
      : existingHireRequest?.hireStatus === 'pending'
        ? 'Request Pending...'
        : existingHireRequest?.hireStatus === 'accepted'
          ? 'Already Hired'
          : worker.available
            ? 'Hire Now'
            : 'Not Available';

  const hireButtonVariant =
    isOwnProfile || !worker.available || hasPendingRequest
      ? 'secondary'
      : 'primary';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HireModal
        visible={hireModalVisible}
        worker={worker}
        onConfirm={handleHireConfirm}
        onClose={() => setHireModalVisible(false)}
      />

      <View
        style={{
          backgroundColor: colors.navy,
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 30,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { position: 'absolute', left: 20, top: topInset + 12 },
          ]}
        >
          <Feather name='arrow-left' size={20} color='#FFFFFF' />
        </TouchableOpacity>

        <View
          style={[
            styles.avatarLarge,
            { backgroundColor: colors.accent, overflow: 'hidden' },
          ]}
        >
          {worker.avatar ? (
            <Image
              source={{ uri: worker.avatar }}
              style={{ width: 90, height: 90, borderRadius: 45 }}
              contentFit='cover'
            />
          ) : (
            <Text
              style={{
                fontSize: 40,
                fontWeight: '700',
                color: '#FFFFFF',
                fontFamily: 'Inter_700Bold',
              }}
            >
              {worker.name.charAt(0)}
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
          {worker.name}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.accent,
            fontFamily: 'Inter_500Medium',
            marginTop: 4,
          }}
        >
          {worker.profession}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
          }}
        >
          <Badge
            label={worker.available ? 'Available Now' : 'Currently Busy'}
            variant={worker.available ? 'success' : 'muted'}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name='map-pin' size={12} color='rgba(255,255,255,0.5)' />
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Inter_400Regular',
              }}
            >
              {worker.location}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Platform.OS === 'web' ? 100 : 60,
          gap: 16,
        }}
      >
        <Card
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            padding: 20,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Feather name='star' size={16} color='#F59E0B' />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                {worker.rating}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
                marginTop: 4,
              }}
            >
              Rating
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: colors.foreground,
                fontFamily: 'Inter_700Bold',
              }}
            >
              {worker.reviews}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
                marginTop: 4,
              }}
            >
              Reviews
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: colors.foreground,
                fontFamily: 'Inter_700Bold',
              }}
            >
              {worker.completedJobs}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
                marginTop: 4,
              }}
            >
              Jobs Done
            </Text>
          </View>
        </Card>

        <Card>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.foreground,
              fontFamily: 'Inter_700Bold',
              marginBottom: 10,
            }}
          >
            About
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
              lineHeight: 22,
            }}
          >
            {worker.bio || 'No bio provided.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 14 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Feather name='clock' size={14} color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.foreground,
                  fontFamily: 'Inter_500Medium',
                }}
              >
                {worker.experience} exp
              </Text>
            </View>

          </View>
        </Card>

        <Card>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.foreground,
              fontFamily: 'Inter_700Bold',
              marginBottom: 12,
            }}
          >
            Rating Breakdown
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginBottom: 8,
            }}
          >
            {stars.map((s) => (
              <Feather
                key={s}
                name='star'
                size={20}
                color={
                  s <= Math.floor(worker.rating) ? '#F59E0B' : colors.border
                }
              />
            ))}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.foreground,
                fontFamily: 'Inter_700Bold',
                marginLeft: 8,
              }}
            >
              {worker.rating} / 5
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Based on {worker.reviews} verified reviews
          </Text>
        </Card>

        {!isOwnProfile && (
          <Button
            title={hireButtonTitle}
            onPress={handleHirePress}
            variant={hireButtonVariant}
            size='lg'
            loading={hireSending}
            disabled={hireSending || !worker.available || hasPendingRequest}
          />
        )}
      </ScrollView>
    </View>
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
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  infoChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  messageInput: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 20,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
