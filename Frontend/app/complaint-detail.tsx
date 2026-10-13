import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useData, Complaint } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card } from '@/components/ThemedComponents';

export default function ComplaintDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { complaints, fetchComplaintById, updateComplaintStatus } = useData();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      const cached = complaints.find((c) => c.id === id);
      if (cached) setComplaint(cached);
      const fetched = await fetchComplaintById(id!);
      if (fetched) {
        setComplaint(fetched);
      } else if (!cached) {
        setError('Complaint not found');
      }
      setLoading(false);
    })();
  }, [id]);

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

  if (!complaint || error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
          }}
        >
          {error || 'Complaint not found'}
        </Text>
      </View>
    );
  }

  const statusVariant = {
    pending: 'warning' as const,
    in_progress: 'info' as const,
    resolved: 'success' as const,
    rejected: 'danger' as const,
  };

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function handleStatusUpdate(newStatus: string) {
    if (!complaint) return;
    try {
      setActionLoading(true);
      await updateComplaintStatus(complaint.id, newStatus);
      const updated = await fetchComplaintById(complaint.id);
      if (updated) setComplaint(updated);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssignmentResponse(status: 'accepted' | 'rejected') {
    if (!complaint) return;
    try {
      setActionLoading(true);
      await updateComplaintStatus(complaint.id, complaint.status, { 
        assignmentStatus: status,
        ...(status === 'rejected' ? { rejectionReason } : {})
      });
      const updated = await fetchComplaintById(complaint.id);
      if (updated) setComplaint(updated);
      setRejecting(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update assignment status');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          backgroundColor: colors.navy,
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name='arrow-left' size={20} color='#FFFFFF' />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Complaint Details</Text>
        </View>
        <Badge
          label={complaint.status.replace('_', ' ')}
          variant={statusVariant[complaint.status]}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Platform.OS === 'web' ? 100 : 60,
          gap: 16,
        }}
      >
        <Card>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.foreground,
              fontFamily: 'Inter_700Bold',
              marginBottom: 8,
            }}
          >
            {complaint.title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
              lineHeight: 22,
              marginBottom: 16,
            }}
          >
            {complaint.description}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Feather name='tag' size={14} color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.primary,
                  fontFamily: 'Inter_500Medium',
                }}
              >
                {complaint.category}
              </Text>
            </View>
            {complaint.location ? (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Feather
                  name='map-pin'
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_400Regular',
                  }}
                >
                  {complaint.location}
                </Text>
              </View>
            ) : null}
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Feather
                name='calendar'
                size={14}
                color={colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                }}
              >
                {formatDate(complaint.createdAt)}
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
              marginBottom: 16,
            }}
          >
            Status Timeline
          </Text>
          {complaint.timeline.map((step, index) => {
            const isLast = index === complaint.timeline.length - 1;
            const stepVariant = {
              pending: { color: colors.warning, bg: colors.warning + '18' },
              in_progress: { color: colors.info, bg: colors.info + '18' },
              resolved: { color: colors.success, bg: colors.success + '18' },
              rejected: {
                color: colors.destructive,
                bg: colors.destructive + '18',
              },
            }[step.status] ?? {
              color: colors.primary,
              bg: colors.primary + '18',
            };

            return (
              <View key={index} style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ alignItems: 'center', width: 24 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: stepVariant.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather
                      name={
                        step.status === 'resolved'
                          ? 'check-circle'
                          : step.status === 'in_progress'
                            ? 'loader'
                            : step.status === 'rejected'
                              ? 'x-circle'
                              : 'clock'
                      }
                      size={12}
                      color={stepVariant.color}
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={{
                        width: 2,
                        flex: 1,
                        backgroundColor: colors.border,
                        marginTop: 4,
                        marginBottom: 4,
                        minHeight: 24,
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.foreground,
                      fontFamily: 'Inter_600SemiBold',
                      textTransform: 'capitalize',
                    }}
                  >
                    {step.status.replace('_', ' ')}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.mutedForeground,
                      fontFamily: 'Inter_400Regular',
                      marginTop: 2,
                    }}
                  >
                    {step.note}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.mutedForeground,
                      fontFamily: 'Inter_400Regular',
                      marginTop: 4,
                    }}
                  >
                    {formatDate(step.date)}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {user?.role === 'worker' && complaint.status !== 'resolved' && complaint.status !== 'rejected' && (
          <View style={{ marginTop: 24, gap: 12 }}>
            {complaint.assignmentStatus === 'pending' && !rejecting && (
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => handleAssignmentResponse('accepted')}
                  disabled={actionLoading}
                  style={{
                    backgroundColor: colors.primary,
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Accept Assignment</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRejecting(true)}
                  disabled={actionLoading}
                  style={{
                    backgroundColor: colors.destructive + '15',
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: colors.destructive, fontWeight: 'bold', fontSize: 16 }}>Reject Assignment</Text>
                </TouchableOpacity>
              </View>
            )}

            {rejecting && (
              <View style={{ gap: 12, backgroundColor: colors.card, padding: 16, borderRadius: 12 }}>
                <Text style={{ color: colors.foreground, fontWeight: 'bold' }}>Reason for Rejection</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.foreground,
                    minHeight: 80,
                  }}
                  multiline
                  placeholder="Why are you rejecting this task?"
                  placeholderTextColor={colors.mutedForeground}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setRejecting(false)}
                    style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: colors.muted }}
                  >
                    <Text style={{ color: colors.foreground, fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAssignmentResponse('rejected')}
                    style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: colors.destructive }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {complaint.assignmentStatus === 'accepted' && complaint.status === 'pending' && (
              <TouchableOpacity
                onPress={() => handleStatusUpdate('in_progress')}
                disabled={actionLoading}
                style={{
                  backgroundColor: colors.primary,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    Start Work
                  </Text>
                )}
              </TouchableOpacity>
            )}
            
            {complaint.assignmentStatus === 'accepted' && complaint.status === 'in_progress' && (
              <TouchableOpacity
                onPress={() => handleStatusUpdate('resolved')}
                disabled={actionLoading}
                style={{
                  backgroundColor: colors.success,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    Mark as Resolved
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
});
