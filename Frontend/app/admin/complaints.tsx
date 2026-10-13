import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { getComplaints, Complaint } from '@/api/complainAdmin';
import { useColors } from '@/hooks/useColors';

type ComplaintStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export default function AdminComplaintsScreen() {
  const colors = useColors();
  const styles = createStyles(colors);

 const { filter: filterParam } = useLocalSearchParams<{
    filter?: ComplaintStatus | 'all';
  }>();

  const [filter, setFilter] = useState<ComplaintStatus | 'all'>(
    filterParam || 'all'
  );

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load complaints from backend
  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      setLoading(true);
      setError('');

      const data = await getComplaints();

      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    if (filter === 'all') {
      return complaints;
    }

    return complaints.filter(
      (item) => item.status === filter
    );
  }, [complaints, filter]);

  // Format MongoDB date
  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  }

  // Format status
  function formatStatus(status: ComplaintStatus) {
    if (status === 'in_progress') {
      return 'In Progress';
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading complaints...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Complaints
            </Text>

            <Text style={styles.subtitle}>
              Review and manage community issues
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Feather
              name="alert-circle"
              size={21}
              color="#fff"
            />
          </View>
        </View>

        {/* ERROR */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              onPress={loadComplaints}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* FILTERS */}
        <FlatList
          horizontal
          style={{ flexGrow: 0, minHeight: 60, maxHeight: 60 }}
          data={[
            'all',
            'pending',
            'in_progress',
            'resolved',
            'rejected',
          ] as const}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setFilter(item)}
              style={[
                styles.filterButton,
                filter === item &&
                  styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item &&
                    styles.filterTextActive,
                ]}
              >
                {item === 'all'
                  ? 'All'
                  : item === 'in_progress'
                    ? 'In Progress'
                    : item.charAt(0).toUpperCase() +
                      item.slice(1)}
              </Text>
            </Pressable>
          )}
        />

        {/* COMPLAINT LIST */}
        <FlatList
          style={{ flex: 1 }}
          data={filteredComplaints}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { flexGrow: 1, paddingBottom: Platform.OS === 'web' ? 120 : 30 }]}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { flex: 1 }]}>
              <Feather
                name="inbox"
                size={40}
                color={colors.mutedForeground}
              />

              <Text style={styles.emptyTitle}>
                No complaints found
              </Text>

              <Text style={styles.emptyText}>
                There are no complaints for this filter.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>

              {/* CARD HEADER */}
              <View style={styles.cardHeader}>

                <View style={styles.categoryIcon}>
                  <Feather
                    name="alert-triangle"
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.titleContainer}>
                  <Text
                    style={styles.complaintTitle}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  <Text style={styles.date}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>

                {/* PRIORITY */}
                <View
                  style={[
                    styles.priority,
                    {
                      backgroundColor:
                        item.priority === 'urgent'
                          ? `${colors.destructive}18`
                          : `${colors.accent}18`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color:
                          item.priority === 'urgent'
                            ? colors.destructive
                            : colors.accent,
                      },
                    ]}
                  >
                    {item.priority}
                  </Text>
                </View>
              </View>

              {/* DESCRIPTION */}
              <Text
                style={styles.description}
                numberOfLines={2}
              >
                {item.description}
              </Text>

              {/* CATEGORY */}
              <View style={styles.infoRow}>
                <Feather
                  name="tag"
                  size={14}
                  color={colors.mutedForeground}
                />

                <Text style={styles.infoText}>
                  {item.category}
                </Text>
              </View>

              {/* USER */}
              <View style={styles.infoRow}>
                <Feather
                  name="user"
                  size={14}
                  color={colors.mutedForeground}
                />

                <Text style={styles.infoText}>
                  {item.user?.name ?? 'Unknown User'}
                </Text>
              </View>

              {/* LOCATION */}
              <View style={styles.infoRow}>
                <Feather
                  name="map-pin"
                  size={14}
                  color={colors.mutedForeground}
                />

                <Text
                  style={styles.infoText}
                  numberOfLines={1}
                >
                  {item.location?.address ??
                    'No location'}
                </Text>
              </View>

              {/* REJECTION REASON (if rejected by worker) */}
              {item.assignmentStatus === 'rejected' && (
                <View style={[styles.infoRow, { marginTop: 4, backgroundColor: colors.destructive + '15', padding: 8, borderRadius: 8, alignItems: 'flex-start' }]}>
                  <Feather
                    name="x-circle"
                    size={14}
                    color={colors.destructive}
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoText, { color: colors.destructive, fontFamily: 'Inter_600SemiBold', marginBottom: 2 }]}>
                      Rejected by Worker {item.assignedTo?.name ? `(${item.assignedTo.name})` : ''}
                    </Text>
                    <Text style={[styles.infoText, { color: colors.destructive }]}>
                      Reason: {item.rejectionReason || 'No reason provided'}
                    </Text>
                  </View>
                </View>
              )}

              {/* BOTTOM */}
              <View style={styles.bottomRow}>

                {/* STATUS */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === 'resolved'
                          ? `${colors.success}18`
                          : item.status === 'rejected'
                            ? `${colors.destructive}18`
                            : `${colors.primary}18`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status === 'resolved'
                            ? colors.success
                            : item.status === 'rejected'
                              ? colors.destructive
                              : colors.primary,
                      },
                    ]}
                  >
                    {formatStatus(item.status)}
                  </Text>
                </View>

                {/* VIEW DETAILS */}
              <Pressable style={styles.viewButton} 
              onPress={() => {
                 router.push({ 
                pathname: '/complaint/[id]', 
                 params: { id: item._id, },
                  }); }} > 
                  <Text 
                  style={styles.viewText}
                  > View Details 
                  </Text>
                   <Feather name="arrow-right" size={14} color={colors.primary} />
                    </Pressable>

              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useColors>
) =>
  StyleSheet.create({

    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    container: {
      flex: 1,
      paddingHorizontal: 18,
    },

    /* HEADER */
    header: {
      backgroundColor: colors.navy,
      marginHorizontal: -18,
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

    /* FILTERS */
    filters: {
      gap: 8,
      paddingVertical: 14,
    },

    filterButton: {
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },

    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    filterText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
    },

    filterTextActive: {
      color: '#fff',
    },

    /* LIST */
    list: {
      paddingBottom: 30,
      gap: 12,
    },

    /* CARD */
    card: {
      backgroundColor: colors.card,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
    },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },

    titleContainer: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
    },

    complaintTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },

    date: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      marginTop: 3,
    },

    /* PRIORITY */
    priority: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
    },

    priorityText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 10,
      textTransform: 'capitalize',
    },

    /* DESCRIPTION */
    description: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 18,
      marginTop: 13,
      marginBottom: 10,
    },

    /* INFO */
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },

    infoText: {
      flex: 1,
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      marginLeft: 8,
      textTransform: 'capitalize',
    },

    /* BOTTOM */
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 7,
    },

    statusText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
    },

    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    viewText: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },

    /* LOADING */
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      marginTop: 10,
    },

    /* ERROR */
    errorContainer: {
      padding: 12,
      marginTop: 10,
      borderRadius: 10,
      backgroundColor: `${colors.destructive}15`,
      alignItems: 'center',
    },

    errorText: {
      color: colors.destructive,
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
    },

    retryButton: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.destructive,
    },

    retryText: {
      color: '#fff',
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },

    /* EMPTY */
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 70,
    },

    emptyTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      marginTop: 12,
    },

    emptyText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginTop: 5,
      textAlign: 'center',
    },
  });
