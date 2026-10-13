import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import ImageViewer from 'react-native-image-zoom-viewer';
import React, { useEffect, useState } from 'react';
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
import { useData, Quotation } from '@/context/DataContext';
import { Badge, Card, EmptyState } from '@/components/ThemedComponents';

// ── Rating Modal ─────────────────────────────────────────────────────────────
function RatingModal({
  visible,
  workerName,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  workerName: string;
  onSubmit: (rating: number, review: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please tap a star before submitting.');
      return;
    }
    onSubmit(rating, review);
    setRating(0);
    setReview('');
  }

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Rate {workerName}
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
            How was your experience with this worker?
          </Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ padding: 6 }}>
                <Feather
                  name='star'
                  size={38}
                  color={s <= rating ? '#F59E0B' : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
              {LABELS[rating]}
            </Text>
          )}

          {/* Review text */}
          <View
            style={[
              styles.reviewBox,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={review}
              onChangeText={setReview}
              placeholder='Leave a review (optional)...'
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
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
                Skip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#FFF', fontFamily: 'Inter_600SemiBold' }}>
                Submit Rating
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Quotation Card ────────────────────────────────────────────────────────────
function QuotationCard({
  quotation,
  onAccept,
  onReject,
  onDelete,
  isWorker,
}: {
  quotation: Quotation;
  onAccept: () => void;
  onReject: () => void;
  onDelete?: () => void;
  isWorker?: boolean;
}) {
  const colors = useColors();
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  const isAccepted = quotation.status === 'accepted';
  const isRejected = quotation.status === 'rejected';
  const isPending = quotation.status === 'pending';

  return (
    <View
      style={{
        marginBottom: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isAccepted
          ? colors.success
          : isRejected
            ? colors.destructive + '40'
            : colors.border,
        opacity: isRejected ? 0.7 : 1,
        shadowColor: isAccepted ? colors.success : '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isAccepted ? 0.15 : 0.05,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
      }}
    >
      {/* Top Border Accent */}
      {isAccepted && (
        <View style={{ height: 4, backgroundColor: colors.success, width: '100%' }} />
      )}
      
      <View style={{ padding: 16 }}>
        {/* Status banner */}
        {!isWorker && (isAccepted || isRejected) && (
          <View
            style={{
              backgroundColor: isAccepted ? colors.success + '15' : colors.destructive + '15',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              alignSelf: 'flex-start',
              marginBottom: 14,
              flexDirection: 'row',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Feather
              name={isAccepted ? 'check-circle' : 'x-circle'}
              size={13}
              color={isAccepted ? colors.success : colors.destructive}
            />
            <Text
              style={{
                fontSize: 12,
                color: isAccepted ? colors.success : colors.destructive,
                fontFamily: 'Inter_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {isAccepted ? 'Accepted' : 'Rejected'}
            </Text>
          </View>
        )}

        {/* Worker Info & Price Row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          {!isWorker && (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary + '18',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.primary,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                {quotation.workerName.charAt(0)}
              </Text>
            </View>
          )}
          
          <View style={{ flex: 1, paddingTop: 4 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: colors.foreground,
                fontFamily: 'Inter_700Bold',
              }}
            >
              {isWorker ? 'Your Quotation' : quotation.workerName}
            </Text>
            {!isWorker && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                {stars.map((s) => (
                  <Feather
                    key={s}
                    name='star'
                    size={12}
                    color={s <= Math.floor(quotation.workerRating) ? '#F59E0B' : colors.border}
                  />
                ))}
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_500Medium',
                    marginLeft: 4,
                  }}
                >
                  {quotation.workerRating}
                </Text>
              </View>
            )}
          </View>

          <View style={{ alignItems: 'flex-end', paddingTop: 2 }}>
            <View style={{
              backgroundColor: colors.primary + '12',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: colors.primary,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                Rs. {quotation.price.toLocaleString()}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 4, marginRight: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total Price
            </Text>
          </View>
        </View>

        {/* Estimated time */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name='clock' size={14} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
            Estimated time: <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{quotation.estimatedTime}</Text>
          </Text>
        </View>

        {/* Note block */}
        {quotation.note ? (
          <View
            style={{
              backgroundColor: colors.muted + '80',
              borderLeftWidth: 3,
              borderLeftColor: colors.primary,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.foreground,
                fontFamily: 'Inter_400Regular',
                fontStyle: 'italic',
                lineHeight: 22,
              }}
            >
              "{quotation.note}"
            </Text>
          </View>
        ) : null}

        {/* ── WORKER VIEW ── */}
        {isWorker && (
          <View style={{ marginTop: 4 }}>
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: isAccepted
                  ? colors.success + '15'
                  : isRejected
                    ? colors.destructive + '15'
                    : colors.muted,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                alignSelf: 'flex-start',
              }}
            >
              <Feather
                name={isAccepted ? 'check-circle' : isRejected ? 'x-circle' : 'clock'}
                size={14}
                color={
                  isAccepted
                    ? colors.success
                    : isRejected
                      ? colors.destructive
                      : colors.mutedForeground
                }
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Inter_600SemiBold',
                  color: isAccepted
                    ? colors.success
                    : isRejected
                      ? colors.destructive
                      : colors.mutedForeground,
                }}
              >
                {isAccepted
                  ? 'Accepted by resident'
                  : isRejected
                    ? 'Rejected by resident'
                    : 'Awaiting resident response'}
              </Text>
            </View>

            {/* Open Chat button shown only when accepted */}
            {isAccepted && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/chat')}
                style={{
                  marginTop: 14,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Feather name='message-circle' size={16} color='#FFF' />
                <Text style={{ fontSize: 14, color: '#FFF', fontFamily: 'Inter_600SemiBold' }}>
                  Open Chat
                </Text>
              </TouchableOpacity>
            )}

            {isPending && onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                style={{
                  marginTop: 14,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: colors.destructive + '10',
                  borderWidth: 1.5,
                  borderColor: colors.destructive + '40',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Feather name='trash-2' size={16} color={colors.destructive} />
                <Text style={{ fontSize: 14, color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>
                  Undo Quotation
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── RESIDENT VIEW: Accept + Reject (only when pending) ── */}
        {!isWorker && isPending && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              onPress={onReject}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 23,
                borderWidth: 1.5,
                borderColor: colors.destructive + '50',
                backgroundColor: colors.destructive + '10',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Feather name='x' size={16} color={colors.destructive} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>
                Reject
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAccept}
              style={{
                flex: 1.5,
                height: 46,
                borderRadius: 23,
                backgroundColor: colors.success,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                shadowColor: colors.success,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Feather name='check' size={16} color='#FFF' />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF', fontFamily: 'Inter_600SemiBold' }}>
                Accept Offer
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function QuotationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const {
    serviceRequests,
    acceptQuotation,
    rejectQuotation,
    deleteQuotation,
    deleteServiceRequest,
    rateWorker,
    fetchServiceRequestWithQuotations,
  } = useData();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const [ratingModal, setRatingModal] = useState<{
    visible: boolean;
    workerId: string;
    workerName: string;
  }>({ visible: false, workerId: '', workerName: '' });

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const isWorker = user?.role === 'worker';

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      const result = await fetchServiceRequestWithQuotations(requestId!);
      if (!result) setError('Request not found');
      setLoading(false);
    })();
  }, [requestId, fetchServiceRequestWithQuotations]);

  const request = serviceRequests.find((r) => r.id === requestId);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    );
  }

  if (!request || error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>{error || 'Request not found'}</Text>
      </View>
    );
  }

  // Residents can delete only when pending / quoted
  const canDelete = !isWorker && (request.status === 'pending' || request.status === 'quoted');
  const acceptedQuotation = request.quotations.find((q) => q.status === 'accepted');

  function handleAccept(quotation: Quotation) {
    Alert.alert(
      'Accept Quotation',
      'Are you sure? This will accept this worker and open a chat with them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading(quotation.id);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              await acceptQuotation(quotation.id);
              await fetchServiceRequestWithQuotations(requestId!);
              router.push('/(tabs)/chat');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  }

  function handleReject(quotationId: string) {
    Alert.alert(
      'Reject Quotation',
      'Are you sure you want to reject this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(quotationId);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
              await rejectQuotation(quotationId);
              await fetchServiceRequestWithQuotations(requestId!);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  }

  function handleDeleteRequest() {
    Alert.alert(
      'Delete Service Request',
      'Are you sure you want to delete this service request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
              await deleteServiceRequest(requestId!);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete service request. Please try again.');
            }
          },
        },
      ],
    );
  }

  async function handleRatingSubmit(rating: number, review: string) {
    try {
      await rateWorker(ratingModal.workerId, rating, review, requestId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setRatingModal((p) => ({ ...p, visible: false }));
      Alert.alert('Thank you!', 'Your rating has been submitted successfully.');
    } catch {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  }

  function handleDeleteQuotation(quotationId: string) {
    Alert.alert(
      'Undo Quotation',
      'Are you sure you want to undo your quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(quotationId);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
              await deleteQuotation(quotationId);
              await fetchServiceRequestWithQuotations(requestId!);
            } catch {
              Alert.alert('Error', 'Failed to undo quotation. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Rating Modal */}
      <RatingModal
        visible={ratingModal.visible}
        workerName={ratingModal.workerName}
        onSubmit={handleRatingSubmit}
        onClose={() => setRatingModal((p) => ({ ...p, visible: false }))}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: topInset + 20,
          paddingHorizontal: 20,
          paddingBottom: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border + '50',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
          zIndex: 10,
        }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Feather name='arrow-left' size={20} color={colors.foreground} />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 22,
            fontWeight: '800',
            color: colors.foreground,
            fontFamily: 'Inter_700Bold',
            letterSpacing: -0.5,
          }}>
            {isWorker ? 'My Quotation' : 'Quotations'}
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.mutedForeground,
            fontFamily: 'Inter_500Medium',
            marginTop: 2,
          }}>
            {isWorker
              ? 'Track your quotation status'
              : `${request.quotations.length} quotation${request.quotations.length !== 1 ? 's' : ''} received`}
          </Text>
        </View>

        <Badge
          label={request.status.replace('_', ' ')}
          variant={
            request.status === 'accepted'
              ? 'success'
              : request.status === 'quoted'
                ? 'info'
                : 'warning'
          }
        />

        {/* Delete button — residents only, deleteable status */}
        {canDelete && (
          <TouchableOpacity
            onPress={handleDeleteRequest}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.destructive + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
            }}
          >
            <Feather name='trash-2' size={18} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Platform.OS === 'web' ? 100 : 60,
          flexGrow: 1,
        }}
      >
        {/* Request summary */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.05,
            shadowRadius: 16,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 12 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.primary + '15',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Feather name='tool' size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                  textTransform: 'capitalize',
                  letterSpacing: -0.3,
                }}
              >
                {request.category.replace('_', ' ')}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_500Medium',
                  marginTop: 2,
                }}
              >
                Service Details
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 15,
              color: colors.foreground,
              fontFamily: 'Inter_400Regular',
              lineHeight: 24,
              marginBottom: request.images && request.images.length > 0 ? 16 : 0,
            }}
          >
            {request.description}
          </Text>
          
          {request.images && request.images.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {request.images.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setImageIndex(index);
                    setImageViewerVisible(true);
                  }}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Image
                    source={{ uri }}
                    style={{ width: 70, height: 70, borderRadius: 12, borderWidth: 1, borderColor: colors.border + '50' }}
                    contentFit='cover'
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Rate Worker banner — resident only, after acceptance */}
        {!isWorker && acceptedQuotation && request.status === 'accepted' && (
          <TouchableOpacity
            onPress={() =>
              setRatingModal({
                visible: true,
                workerId: acceptedQuotation.workerId,
                workerName: acceptedQuotation.workerName,
              })
            }
            style={{
              backgroundColor: colors.success + '15',
              borderRadius: colors.radius,
              padding: 14,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: colors.success + '40',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.success + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name='star' size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.success,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                Rate {acceptedQuotation.workerName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.success,
                  fontFamily: 'Inter_400Regular',
                  marginTop: 2,
                  opacity: 0.8,
                }}
              >
                Share your experience to help others find great workers
              </Text>
            </View>
            <Feather name='chevron-right' size={16} color={colors.success} />
          </TouchableOpacity>
        )}

        {/* Action loading indicator */}
        {actionLoading && (
          <View
            style={{
              padding: 12,
              backgroundColor: colors.muted,
              borderRadius: colors.radius,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <ActivityIndicator size='small' color={colors.primary} />
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
              Processing...
            </Text>
          </View>
        )}

        {/* ── WORKER: only their own quotation ── */}
        {isWorker ? (
          (() => {
            const myQuotation = request.quotations.find((q) => q.workerId === user?.id);
            if (!myQuotation) {
              return (
                <EmptyState
                  icon={<Feather name='send' size={32} color={colors.mutedForeground} />}
                  title='Quotation not found'
                  description='Your quotation may still be processing.'
                />
              );
            }
            return (
              <QuotationCard
                quotation={myQuotation}
                onAccept={() => {}}
                onReject={() => {}}
                onDelete={() => handleDeleteQuotation(myQuotation.id)}
                isWorker
              />
            );
          })()
        ) : request.quotations.length === 0 ? (
          <EmptyState
            icon={<Feather name='inbox' size={32} color={colors.mutedForeground} />}
            title='Waiting for quotations'
            description="Workers will send their quotations shortly. You'll be notified when they arrive."
          />
        ) : (
          request.quotations.map((q) => (
            <QuotationCard
              key={q.id}
              quotation={q}
              onAccept={() => handleAccept(q)}
              onReject={() => handleReject(q.id)}
              isWorker={false}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={imageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
        <ImageViewer
          imageUrls={(request?.images || []).map((uri) => ({ url: uri }))}
          index={imageIndex}
          enableSwipeDown={true}
          onSwipeDown={() => setImageViewerVisible(false)}
          onClick={() => setImageViewerVisible(false)}
          renderIndicator={() => <View />}
        />
      </Modal>
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
  // Rating modal
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  ratingLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
  },
  reviewBox: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});