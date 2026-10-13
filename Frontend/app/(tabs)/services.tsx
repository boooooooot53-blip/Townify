import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  View,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { uploadImages, takePhoto } from '@/utils/imageUpload';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useData, Worker, ServiceRequest } from '@/context/DataContext';
import {
  Badge,
  Card,
  EmptyState,
  Input,
  SectionHeader,
} from '@/components/ThemedComponents';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'carpentry', label: 'Carpentry' },
  { id: 'ac_repair', label: 'AC Repair' },
  { id: 'painting', label: 'Painting' },
  { id: 'pest_control', label: 'Pest Control' },
];

const CAT_ICONS: Record<string, any> = {
  electrical: 'zap',
  plumbing: 'droplet',
  carpentry: 'tool',
  ac_repair: 'wind',
  painting: 'edit-2',
  pest_control: 'shield',
};

function WorkerCard({
  worker,
  onPress,
}: {
  worker: Worker;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary + '18',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {worker.avatar ? (
              <Image
                source={{ uri: worker.avatar }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
                contentFit='cover'
              />
            ) : (
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.primary,
                  fontFamily: 'Inter_700Bold',
                }}
              >
                {worker.name.charAt(0)}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.foreground,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {worker.name}
              </Text>
              <Badge
                label={worker.available ? 'Available' : 'Busy'}
                variant={worker.available ? 'success' : 'muted'}
              />
            </View>
            <Text
              style={{
                fontSize: 13,
                color: colors.primary,
                fontFamily: 'Inter_500Medium',
                marginTop: 2,
              }}
            >
              {worker.profession}
            </Text>
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Feather name='star' size={13} color='#F59E0B' />
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.foreground,
                    fontFamily: 'Inter_500Medium',
                  }}
                >
                  {worker.rating}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_400Regular',
                  }}
                >
                  ({worker.reviews})
                </Text>
              </View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Feather
                  name='map-pin'
                  size={12}
                  color={colors.mutedForeground}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_400Regular',
                  }}
                >
                  {worker.location}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
              }}
            >

              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {worker.completedJobs} jobs done
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function JobCard({
  request,
  onPress,
  onQuote,
  onChat,
  onDelete,
  onReject,
  isWorker,
  alreadyQuoted,
  currentUserId,
}: {
  request: ServiceRequest;
  onPress: () => void;
  onQuote?: () => void;
  onChat?: () => void;
  onDelete?: () => void;
  onReject?: () => void;
  isWorker?: boolean;
  alreadyQuoted?: boolean;
  currentUserId?: string;
}) {
  const colors = useColors();
  const icon = CAT_ICONS[request.category] ?? 'tool';
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleCardPress = () => {
    if (isWorker && request.assignedByAdmin && request.workerId === currentUserId) {
      if (request.images && request.images.length > 0) {
        setImageViewerVisible(true);
      }
    } else if (onPress) {
      onPress();
    }
  };
 
  const myQuotation =
    isWorker && currentUserId
      ? request.quotations.find((q) => q.workerId === currentUserId)
      : null;

  const myQuotationStatus = myQuotation?.status ?? null;

  
  function getStatusBadge() {
    if (isWorker && myQuotationStatus) {
      if (myQuotationStatus === 'accepted') {
        return <Badge label='Accepted' variant='success' />;
      }
      if (myQuotationStatus === 'rejected') {
      
        return (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 100,
              backgroundColor: colors.destructive + '18',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Feather name='x-circle' size={11} color={colors.destructive} />
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_600SemiBold',
                color: colors.destructive,
              }}
            >
              Rejected
            </Text>
          </View>
        );
      }
      if (myQuotationStatus === 'pending') {
        return <Badge label='Sent' variant='info' />;
      }
    }
    // Default: service request status for residents
    return (
      <Badge
        label={request.status.replace('_', ' ')}
        variant={
          request.status === 'completed'
            ? 'success'
            : request.status === 'quoted'
              ? 'info'
              : request.status === 'accepted'
                ? 'success'
                : 'warning'
        }
      />
    );
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.primary + '15',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name={icon} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                  textTransform: 'capitalize',
                }}
              >
                {request.category.replace('_', ' ')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {getStatusBadge()}
                {onDelete && !isWorker && (
                  <TouchableOpacity onPress={onDelete} style={{ padding: 4 }}>
                    <Feather name='trash-2' size={16} color={colors.destructive} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
                marginTop: 3,
                lineHeight: 19,
              }}
              numberOfLines={2}
            >
              {request.description}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
          {request.userName ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              {request.userAvatar ? (
                <Image
                  source={{ uri: request.userAvatar }}
                  style={{ width: 16, height: 16, borderRadius: 8 }}
                  contentFit='cover'
                />
              ) : (
                <Feather name='user' size={12} color={colors.mutedForeground} />
              )}
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {request.userName}
              </Text>
            </View>
          ) : null}
          {request.userLocation ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Feather
                name='map-pin'
                size={12}
                color={colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {request.userLocation}
              </Text>
            </View>
          ) : null}
          {request.images && request.images.length > 0 ? (
            <View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Feather name='image' size={12} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_400Regular',
                  }}
                >
                  {request.images.length} photo{request.images.length > 1 ? 's' : ''} (Tap to view)
                </Text>
              </View>
              {isWorker && request.assignedByAdmin && request.workerId === currentUserId && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {request.images.map((img, idx) => (
                    <TouchableOpacity key={idx} onPress={() => { setCurrentImageIndex(idx); setImageViewerVisible(true); }}>
                      <Image
                        source={{ uri: img }}
                        style={{ width: 64, height: 64, borderRadius: 8, marginRight: 8, backgroundColor: colors.muted }}
                        contentFit='cover'
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather
              name='message-square'
              size={12}
              color={colors.mutedForeground}
            />
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {request.quotations.length} quotation
              {request.quotations.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Worker action row */}
      {isWorker && (
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {request.assignedByAdmin && request.workerId === currentUserId ? (
            <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
              {request.status === 'assigned' && (
                <>
                  <TouchableOpacity
                    onPress={onReject}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: colors.destructive + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6,
                    }}
                  >
                    <Feather name='x' size={14} color={colors.destructive} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>
                      Reject
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onPress}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6,
                    }}
                  >
                    <Feather name='check' size={14} color='#FFF' />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF', fontFamily: 'Inter_600SemiBold' }}>
                      Accept
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {request.status === 'accepted' && (
                <TouchableOpacity
                  onPress={onPress}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Feather name='play' size={14} color='#FFF' />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF', fontFamily: 'Inter_600SemiBold' }}>
                    Start Job
                  </Text>
                </TouchableOpacity>
              )}
              {request.status === 'in_progress' && (
                <TouchableOpacity
                  onPress={onPress}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: colors.success,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Feather name='check-circle' size={14} color='#FFF' />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF', fontFamily: 'Inter_600SemiBold' }}>
                    Complete Job
                  </Text>
                </TouchableOpacity>
              )}
              {request.status === 'rejected' && (
                <View
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: colors.destructive + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Feather name='x-circle' size={14} color={colors.destructive} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>
                    Rejected by you
                  </Text>
                </View>
              )}
            </View>
          ) : myQuotationStatus === 'rejected' ? (
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: colors.destructive + '10',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.destructive + '30',
              }}
            >
              <Feather name='x-circle' size={14} color={colors.destructive} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_500Medium',
                  color: colors.destructive,
                  flex: 1,
                }}
              >
                Your quotation was rejected
              </Text>
            </View>
          ) : !myQuotationStatus ? (
            // Not quoted yet — show Chat and Send Quotation buttons
            <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={onChat}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.accent + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  borderWidth: 1.5,
                  borderColor: colors.accent + '40',
                }}
              >
                <Feather name='message-square' size={14} color={colors.accent} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.accent,
                    fontFamily: 'Inter_600SemiBold',
                  }}
                >
                  Chat
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onQuote}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <Feather name='send' size={14} color='#FFF' />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: '#FFF',
                    fontFamily: 'Inter_600SemiBold',
                  }}
                >
                  Quote
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Pending or accepted — show Chat and "Quotation Sent" pill
            <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={onChat}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.accent + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  borderWidth: 1.5,
                  borderColor: colors.accent + '40',
                }}
              >
                <Feather name='message-square' size={14} color={colors.accent} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.accent,
                    fontFamily: 'Inter_600SemiBold',
                  }}
                >
                  Chat
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onPress}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <Feather name='check' size={14} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_600SemiBold',
                  }}
                >
                  {myQuotationStatus === 'accepted' ? 'Accepted' : 'Sent'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* View My Quote button — shown when pending or accepted, not when rejected */}
          {myQuotationStatus && myQuotationStatus !== 'rejected' && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/quotations',
                  params: { requestId: request.id },
                })
              }
              style={{
                height: 38,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: colors.primary + '50',
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Feather name='eye' size={13} color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.primary,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                My Quote
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Image Viewer */}
      {request.images && request.images.length > 0 && (
        <ImageViewing
          images={request.images.map(uri => ({ uri }))}
          imageIndex={currentImageIndex}
          visible={imageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
          swipeToCloseEnabled={true}
        />
      )}
    </Card>
  );
}
export default function ServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    workers,
    serviceRequests,
    complaints,
    workersState,
    serviceRequestsState,
    fetchWorkers,
    fetchServiceRequests,
    fetchComplaints,
    startChat,
    deleteServiceRequest,
    updateAssignedStatus,
    updateComplaintStatus,
  } = useData();
  const [search, setSearch] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingJobId, setRejectingJobId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this service request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteServiceRequest(id);
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Failed to delete request';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  const handleUpdateAssignedStatus = async (id: string, currentStatus: string) => {
    let newStatus = '';
    let actionLabel = '';

    if (currentStatus === 'assigned') {
      newStatus = 'accepted';
      actionLabel = 'Accept';
    } else if (currentStatus === 'accepted') {
      newStatus = 'in_progress';
      actionLabel = 'Start';
    } else if (currentStatus === 'in_progress') {
      newStatus = 'completed';
      actionLabel = 'Complete';
    } else {
      return;
    }

    const executeUpdate = async (completionImages?: string[]) => {
      try {
        if (id.startsWith('comp_')) {
          const realId = id.replace('comp_', '');
          if (newStatus === 'accepted') {
            await updateComplaintStatus(realId, 'pending', { assignmentStatus: 'accepted' });
          } else if (newStatus === 'in_progress') {
            await updateComplaintStatus(realId, 'in_progress');
          } else if (newStatus === 'completed') {
            await updateComplaintStatus(realId, 'resolved', { completionImages });
          }
        } else {
          await updateAssignedStatus(id, newStatus, undefined, completionImages);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to update job status';
        Alert.alert('Error', msg);
      } finally {
        setIsUploading(false);
      }
    };

    if (newStatus === 'completed') {
      Alert.alert(
        'Complete Job',
        'Please take a picture of the finished work to send to the admin.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Camera',
            onPress: async () => {
              try {
                const photoUri = await takePhoto();
                if (photoUri) {
                  setIsUploading(true);
                  const uploadedUrls = await uploadImages([photoUri]);
                  await executeUpdate(uploadedUrls);
                }
              } catch (e: any) {
                setIsUploading(false);
                Alert.alert('Error', e.message || 'Failed to upload image.');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        `${actionLabel} Job`,
        `Are you sure you want to ${actionLabel.toLowerCase()} this job?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: actionLabel,
            style: 'default',
            onPress: () => executeUpdate(),
          },
        ]
      );
    }
  };

  const handleRejectJob = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejecting.');
      return;
    }
    try {
      if (rejectingJobId.startsWith('comp_')) {
        const realId = rejectingJobId.replace('comp_', '');
        await updateComplaintStatus(realId, 'pending', { assignmentStatus: 'rejected', rejectionReason });
      } else {
        await updateAssignedStatus(rejectingJobId, 'rejected', rejectionReason);
      }
      setRejectModalVisible(false);
      setRejectionReason('');
      setRejectingJobId('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reject job';
      Alert.alert('Error', msg);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchServiceRequests();
    if (user?.role === 'worker') {
      fetchComplaints();
    }
  }, [fetchWorkers, fetchServiceRequests, fetchComplaints, user?.role]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [workerTab, setWorkerTab] = useState<
    'jobboard' | 'myrequests' | 'assigned' | 'workers'
  >('jobboard');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const isWorker = user?.role === 'worker';
  const myId = user?.id ?? 'u1';

  const filteredWorkers = workers.filter((w) => {
    if (w.approved === false) return false;
    const matchCat =
      selectedCategory === 'all' || w.categories.includes(selectedCategory);
    const matchSearch =
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.profession.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const jobBoard = serviceRequests.filter(
    (r) =>
      r.userId !== myId &&
      (r.status === 'pending' || r.status === 'quoted') &&
      (!isWorker || !user?.categories || user.categories.length === 0 || user.categories.some(c => c.toLowerCase() === r.category.toLowerCase())),
  );

  const myRequests = serviceRequests.filter((r) => r.userId === myId);
  const activeMyRequests = myRequests
    .filter((r) => r.status !== 'completed')
    .filter((r) => {
      if (isWorker) return true;
      return (
        selectedCategory === 'all' ||
        r.category === selectedCategory ||
        r.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    })
    .sort((a, b) => {
      const aHasQuote = a.quotations && a.quotations.length > 0 ? 1 : 0;
      const bHasQuote = b.quotations && b.quotations.length > 0 ? 1 : 0;
      if (bHasQuote !== aHasQuote) {
        return bHasQuote - aHasQuote;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const assignedServiceRequests = serviceRequests.filter(
    (r) => r.assignedByAdmin && r.workerId === myId && r.status !== 'completed'
  );
  
  const assignedComplaintsAsJobs = complaints
    .filter((c) => c.assignmentStatus && c.status !== 'resolved')
    .map((c) => ({
      id: `comp_${c.id}`,
      title: c.title,
      description: c.description,
      category: c.category,
      status: c.assignmentStatus === 'pending' ? 'assigned' : c.assignmentStatus === 'accepted' ? (c.status === 'in_progress' ? 'in_progress' : 'accepted') : 'rejected',
      createdAt: c.createdAt,
      images: c.images,
      userId: c.userId,
      userLocation: c.location,
      workerId: myId,
      assignedByAdmin: true,
      quotations: [],
      isComplaint: true,
    }));

  const assignedJobs = [...assignedServiceRequests, ...assignedComplaintsAsJobs] as any[];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.navy,
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        <Text style={styles.headerTitle}>
          {isWorker ? 'Job Hub' : 'Labour Finder'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isWorker
            ? 'Browse jobs & send quotations'
            : 'Find skilled professionals near you'}
        </Text>


        {/* Worker mode tabs */}
        {isWorker && (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
            {[
              {
                key: 'jobboard' as const,
                label: 'Job Board',
                icon: 'briefcase' as const,
                count: jobBoard.length,
              },
              {
                key: 'assigned' as const,
                label: 'Assigned',
                icon: 'check-square' as const,
                count: assignedJobs.length,
              },
              {
                key: 'myrequests' as const,
                label: 'My Jobs',
                icon: 'list' as const,
                count: activeMyRequests.length,
              },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setWorkerTab(tab.key)}
                style={[
                  styles.workerTab,
                  {
                    backgroundColor:
                      workerTab === tab.key
                        ? colors.accent
                        : 'rgba(255,255,255,0.12)',
                    flex: 1,
                  },
                ]}
              >
                <Feather
                  name={tab.icon}
                  size={12}
                  color={
                    workerTab === tab.key ? '#FFF' : 'rgba(255,255,255,0.7)'
                  }
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Inter_600SemiBold',
                    color:
                      workerTab === tab.key ? '#FFF' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {tab.label}
                  {'count' in tab && (tab as any).count > 0
                    ? ` (${(tab as any).count})`
                    : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {(workersState.loading || serviceRequestsState.loading) &&
      workers.length === 0 &&
      serviceRequests.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      ) : null}

      {(workersState.error || serviceRequestsState.error) && (
        <View
          style={{
            margin: 20,
            padding: 12,
            backgroundColor: colors.destructive + '15',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.destructive }}>
            {workersState.error || serviceRequestsState.error}
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'web' ? 120 : 90,
          maxWidth: 800,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        {/* ── WORKER: JOB BOARD ── */}
        {isWorker && workerTab === 'jobboard' && (
          <View style={{ padding: 20 }}>
            <SectionHeader
              title={`Open Jobs (${jobBoard.length})`}
              subtitle="Tap 'Send Quotation' to bid on a job"
            />
            {jobBoard.length === 0 ? (
              <EmptyState
                icon={
                  <Feather
                    name='briefcase'
                    size={32}
                    color={colors.mutedForeground}
                  />
                }
                title='No jobs available'
                description='New job requests from users will appear here automatically.'
              />
            ) : (
              jobBoard
                .filter(
                  (r) =>
                    !search ||
                    r.category.includes(search.toLowerCase()) ||
                    r.description.toLowerCase().includes(search.toLowerCase()),
                )
                .map((req) => {
                  const alreadyQuoted = req.quotations.some(
                    (q) => q.workerId === myId,
                  );
                  return (
                    <JobCard
                      key={req.id}
                      request={req}
                      onDelete={() => handleDelete(req.id)}
                      isWorker
                      alreadyQuoted={alreadyQuoted}
                      currentUserId={myId}
                      onPress={() =>
                        router.push({
                          pathname: '/quotations',
                          params: { requestId: req.id },
                        })
                      }
                      onQuote={() =>
                        router.push({
                          pathname: '/send-quotation',
                          params: {
                            requestId: req.id,
                            category: req.category,
                            description: req.description,
                            userName: req.userName ?? '',
                            userLocation: req.userLocation ?? '',
                            userAvatar: req.userAvatar,
                            images: JSON.stringify(req.images ?? []),
                          },
                        })
                      }
                      onChat={async () => {
                        try {
                          const chatRoom = await startChat(req.userId);
                          router.push({
                            pathname: '/chat-room',
                            params: { roomId: chatRoom.id },
                          });
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                    />
                  );
                })
            )}
          </View>
        )}

        {/* ── WORKER: MY REQUESTS ── */}
        {isWorker && workerTab === 'myrequests' && (
          <View style={{ padding: 20 }}>
            <SectionHeader
              title='My Posted Jobs'
              subtitle='Jobs you posted as a resident'
            />
            {activeMyRequests.length === 0 ? (
              <EmptyState
                icon={
                  <Feather
                    name='file-plus'
                    size={32}
                    color={colors.mutedForeground}
                  />
                }
                title='No requests yet'
                description='As a worker you can also post job requests like any resident.'
                actionLabel='Post a Request'
                onAction={() =>
                  router.push({
                    pathname: '/service-request',
                    params: { category: 'electrical' },
                  })
                }
              />
            ) : (
              activeMyRequests.map((req) => (
                <JobCard
                  key={req.id}
                  request={req}
                  onDelete={() => handleDelete(req.id)}
                  onPress={() =>
                    router.push({
                      pathname: '/quotations',
                      params: { requestId: req.id },
                    })
                  }
                />
              ))
            )}
          </View>
        )}

        {/* ── WORKER: ASSIGNED JOBS ── */}
        {isWorker && workerTab === 'assigned' && (
          <View style={{ padding: 20 }}>
            <SectionHeader
              title='Assigned to Me'
              subtitle='Jobs directly assigned to you by an admin'
            />
            {assignedJobs.length === 0 ? (
              <EmptyState
                icon={
                  <Feather
                    name='check-square'
                    size={32}
                    color={colors.mutedForeground}
                  />
                }
                title='No assigned jobs'
                description='Jobs assigned to you by an admin will appear here.'
              />
            ) : (
              assignedJobs.map((req) => (
                <JobCard
                  key={req.id}
                  request={req}
                  isWorker
                  currentUserId={myId}
                  onPress={() => handleUpdateAssignedStatus(req.id, req.status)}
                  onReject={() => {
                    setRejectingJobId(req.id);
                    setRejectModalVisible(true);
                  }}
                />
              ))
            )}
          </View>
        )}

        {/* ── WORKER: WORKER FINDER HAS BEEN REMOVED FOR WORKERS ── */}

        {/* ── USER: DEFAULT VIEW ── */}
        {!isWorker && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                gap: 8,
              }}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        selectedCategory === cat.id
                          ? colors.primary
                          : colors.secondary,
                      borderColor:
                        selectedCategory === cat.id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      fontFamily: 'Inter_500Medium',
                      color:
                        selectedCategory === cat.id
                          ? colors.primaryForeground
                          : colors.foreground,
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {activeMyRequests.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <SectionHeader
                  title='My Active Requests'
                />
                {activeMyRequests.map((req, index) => (
                  <JobCard
                    key={`${req.id}-${index}`}
                    request={req}
                    onDelete={() => handleDelete(req.id)}
                    onPress={() =>
                      router.push({
                        pathname: '/quotations',
                        params: { requestId: req.id },
                      })
                    }
                  />
                ))}
              </View>
            )}

            <View style={{ paddingHorizontal: 20 }}>
              <SectionHeader
                title={`Available Workers (${filteredWorkers.length})`}
                subtitle={
                  selectedCategory !== 'all'
                    ? CATEGORIES.find((c) => c.id === selectedCategory)?.label
                    : undefined
                }
              />
              {filteredWorkers.length === 0 ? (
                <EmptyState
                  icon={
                    <Feather
                      name='tool'
                      size={32}
                      color={colors.mutedForeground}
                    />
                  }
                  title='No workers found'
                  description='Try changing your search or category filter.'
                />
              ) : (
                filteredWorkers.map((w, index) => (
                  <WorkerCard
                    key={`${w.id}-${index}`}
                    worker={w}
                    onPress={() =>
                      router.push({
                        pathname: '/worker-profile',
                        params: { workerId: w.id },
                      })
                    }
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: Platform.OS === 'web' ? 104 : 74,
          },
        ]}
        onPress={() =>
          router.push({
            pathname: '/service-request',
            params: {
              category:
                selectedCategory !== 'all' ? selectedCategory : 'electrical',
            },
          })
        }
        activeOpacity={0.85}
      >
        <Feather name='plus' size={22} color='#fff' />
        <Text
          style={{
            color: '#fff',
            fontWeight: '600',
            fontFamily: 'Inter_600SemiBold',
            fontSize: 14,
          }}
        >
          {isWorker ? 'Post Job' : 'New Request'}
        </Text>
      </TouchableOpacity>

      {/* Reject Modal */}
      {rejectModalVisible && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
          <View style={{ width: '85%', backgroundColor: colors.card, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 12, fontFamily: 'Inter_700Bold' }}>Reject Job</Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>Please provide a reason for rejecting this job assignment.</Text>
            
            <View style={{ backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 20 }}>
              <TextInput
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Reason for rejection..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ fontSize: 14, color: colors.foreground, fontFamily: 'Inter_400Regular', minHeight: 60 }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setRejectModalVisible(false); setRejectionReason(''); }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.muted }}
              >
                <Text style={{ color: colors.foreground, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRejectJob}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.destructive }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  workerTab: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
