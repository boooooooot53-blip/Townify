import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useData, Complaint } from '@/context/DataContext';
import { Badge, Card, EmptyState } from '@/components/ThemedComponents';

const STATUS_FILTERS = [
  'all',
  'pending',
  'in_progress',
  'resolved',
  'rejected',
];
const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

function ComplaintCard({
  complaint,
  onPress,
  onDelete,
}: {
  complaint: Complaint;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const colors = useColors();
  const statusVariant = {
    pending: 'warning' as const,
    in_progress: 'info' as const,
    resolved: 'success' as const,
    rejected: 'danger' as const,
  };

  const statusColors = {
    pending: '#FB8C00',
    in_progress: '#039BE5',
    resolved: '#43A047',
    rejected: '#E53935',
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ marginBottom: 16 }}>
      <View style={{
        backgroundColor: colors.card,
        borderRadius: colors.radius,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
      }}>
        {/* Status Indicator Strip */}
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: statusColors[complaint.status as keyof typeof statusColors] || colors.border, zIndex: 2 }} />
        
        <View style={{ padding: 16, paddingLeft: 20 }}>
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
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                  marginBottom: 6,
                }}
              >
                {complaint.title}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                  lineHeight: 20,
                }}
                numberOfLines={2}
              >
                {complaint.description}
              </Text>
            </View>
            <Badge
              label={STATUS_LABELS[complaint.status]}
              variant={statusVariant[complaint.status]}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 16,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name='tag' size={14} color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
                  {complaint.category}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name='clock' size={14} color={colors.mutedForeground} />
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
                  {timeAgo(complaint.createdAt)}
                </Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {onDelete && (
                <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name='trash-2' size={16} color={colors.destructive} />
                </TouchableOpacity>
              )}
              <Feather name='chevron-right' size={18} color={colors.mutedForeground} opacity={0.5} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ComplaintsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { complaints, complaintsState, fetchComplaints, deleteComplaint } = useData();
  const [selectedStatus, setSelectedStatus] = useState('all');

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Complaint',
      'Are you sure you want to delete this complaint?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComplaint(id);
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Failed to delete complaint';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchComplaints(
      selectedStatus === 'all' ? undefined : { status: selectedStatus },
    );
  }, [fetchComplaints, selectedStatus]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = complaints.filter(
    (c) => selectedStatus === 'all' || c.status === selectedStatus,
  );

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    in_progress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: 24,
          zIndex: 10,
        }}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground, fontSize: 28, letterSpacing: -0.5 }]}>Complaints</Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground, fontSize: 14 }]}>Track your community issues</Text>

        {/* Stats Bento Grid - 2x2 */}
        <View style={{ gap: 16, marginTop: 24 }}>
          {/* Row 1 */}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {/* Total */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => { setSelectedStatus('all'); Haptics.selectionAsync().catch(() => {}); }}
              style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              padding: 16,
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
              borderWidth: selectedStatus === 'all' ? 2 : 0,
              borderColor: 'rgba(255,255,255,0.5)',
            }}>
              <Feather name="folder" size={80} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', bottom: -15, right: -15, zIndex: 0 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="inbox" size={14} color="#FFF" />
                </View>
                <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                  {stats.total}
                </Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'Inter_500Medium', zIndex: 1 }}>
                Total Complaints
              </Text>
            </TouchableOpacity>
            
            {/* Active (In Progress) */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => { setSelectedStatus('in_progress'); Haptics.selectionAsync().catch(() => {}); }}
              style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              padding: 16,
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: selectedStatus === 'in_progress' ? 2 : 0,
              borderColor: '#039BE550',
            }}>
              <Feather name="activity" size={80} color="#039BE510" style={{ position: 'absolute', bottom: -15, right: -15, zIndex: 0 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#039BE515', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="activity" size={14} color="#039BE5" />
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                  {stats.in_progress}
                </Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Inter_500Medium', zIndex: 1 }}>
                Active
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Row 2 */}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {/* Pending Card */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => { setSelectedStatus('pending'); Haptics.selectionAsync().catch(() => {}); }}
              style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              padding: 16,
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: selectedStatus === 'pending' ? 2 : 0,
              borderColor: '#FB8C0050',
            }}>
              <Feather name="clock" size={80} color="#FB8C0010" style={{ position: 'absolute', bottom: -15, right: -15, zIndex: 0 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FB8C0015', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="clock" size={14} color="#FB8C00" />
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                  {stats.pending}
                </Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Inter_500Medium', zIndex: 1 }}>
                Pending
              </Text>
            </TouchableOpacity>

            {/* Resolved Card */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => { setSelectedStatus('resolved'); Haptics.selectionAsync().catch(() => {}); }}
              style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              padding: 16,
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: selectedStatus === 'resolved' ? 2 : 0,
              borderColor: '#43A04750',
            }}>
              <Feather name="check-circle" size={80} color="#43A04710" style={{ position: 'absolute', bottom: -15, right: -15, zIndex: 0 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#43A04715', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="check" size={14} color="#43A047" />
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                  {stats.resolved}
                </Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Inter_500Medium', zIndex: 1 }}>
                Resolved
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Filter chips — always visible, never clipped ────────────── */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            gap: 10,
          }}
        >
          {STATUS_FILTERS.map((s) => {
            const isActive = selectedStatus === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  setSelectedStatus(s);
                  Haptics.selectionAsync().catch(() => {});
                }}
                activeOpacity={0.7}
                style={[
                  {
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 100,
                    borderWidth: 1,
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                  isActive && {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? '700' : '600',
                    fontFamily: isActive ? 'Inter_700Bold' : 'Inter_600SemiBold',
                    color: isActive ? '#FFF' : colors.foreground,
                  }}
                >
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Loading / error ─────────────────────────────────────────── */}
      {complaintsState.loading && complaints.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      ) : null}

      {complaintsState.error ? (
        <View
          style={{
            margin: 20,
            padding: 12,
            backgroundColor: colors.destructive + '15',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.destructive }}>
            {complaintsState.error}
          </Text>
        </View>
      ) : null}

      {/* ── List — bottom padding clears the FAB ────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 120, 
          flexGrow: 1,
        }}
        renderItem={({ item }) => (
          <ComplaintCard
            complaint={item}
            onDelete={() => handleDelete(item.id)}
            onPress={() =>
              router.push({
                pathname: '/complaint-detail',
                params: { id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={
              <Feather
                name='alert-circle'
                size={32}
                color={colors.mutedForeground}
              />
            }
            title='No complaints found'
            description="You haven't filed any complaints yet. Tap the button below to report an issue."
          />
        }
      />

      {/* ── FAB — sleek pill ──────────────── */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 20,
          bottom: 90,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderRadius: 100,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 8,
        }}
        onPress={() => router.push('/new-complaint')}
        activeOpacity={0.85}
      >
        <Feather name='plus' size={20} color='#fff' />
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>New Complaint</Text>
      </TouchableOpacity>
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
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 3,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#111827',
    shadowColor: '#111827',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  fabLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
