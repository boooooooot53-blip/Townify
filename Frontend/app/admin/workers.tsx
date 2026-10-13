import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  activateWorker,
  approveWorker,
  deactivateWorker,
  getWorkers,
  type Worker,
} from '@/api/adminWorker';

import { useColors } from '@/hooks/useColors';

type Filter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'inactive';

export default function AdminWorkersScreen() {
  const colors = useColors();
  const styles = createStyles(colors);

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const fetchWorkers = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getWorkers();

        setWorkers(data);
      } catch (error) {
        console.error(
          'Failed to fetch workers:',
          error
        );

        Alert.alert(
          'Error',
          'Unable to load workers. Please try again.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const pendingCount = useMemo(
    () =>
      workers.filter(
        (worker) => !worker.approved
      ).length,
    [workers]
  );

  const approvedCount = useMemo(
    () =>
      workers.filter(
        (worker) =>
          worker.approved &&
          worker.isActive
      ).length,
    [workers]
  );

  const inactiveCount = useMemo(
    () =>
      workers.filter(
        (worker) =>
          worker.approved &&
          !worker.isActive
      ).length,
    [workers]
  );

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workers.filter((worker) => {
      const skills =
        worker.workerProfile?.skills
          ?.join(' ')
          .toLowerCase() ?? '';

      const matchesSearch =
        !query ||
        worker.name
          .toLowerCase()
          .includes(query) ||
        worker.email
          .toLowerCase()
          .includes(query) ||
        worker.phone
          .toLowerCase()
          .includes(query) ||
        skills.includes(query);

      let matchesFilter = true;

      if (filter === 'pending') {
        matchesFilter = !worker.approved;
      }

      if (filter === 'approved') {
        matchesFilter =
          worker.approved &&
          worker.isActive;
      }

      if (filter === 'inactive') {
        matchesFilter =
          worker.approved &&
          !worker.isActive;
      }

      return matchesSearch && matchesFilter;
    });
  }, [workers, search, filter]);

  const handleApprove = async (
    worker: Worker
  ) => {
    try {
      setActionLoading(worker._id);

      const updatedWorker =
        await approveWorker(worker._id);

      setWorkers((current) =>
        current.map((item) =>
          item._id === worker._id
            ? updatedWorker
            : item
        )
      );

      Alert.alert(
        'Worker Approved',
        `${worker.name} has been approved successfully.`
      );
    } catch (error) {
      console.error(
        'Approve worker error:',
        error
      );

      Alert.alert(
        'Error',
        'Failed to approve this worker.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = (
    worker: Worker
  ) => {
    Alert.alert(
      'Deactivate Worker',
      `Are you sure you want to deactivate ${worker.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(worker._id);

              const updatedWorker =
                await deactivateWorker(
                  worker._id
                );

              setWorkers((current) =>
                current.map((item) =>
                  item._id === worker._id
                    ? updatedWorker
                    : item
                )
              );

              Alert.alert(
                'Worker Deactivated',
                `${worker.name} has been deactivated.`
              );
            } catch (error) {
              console.error(
                'Deactivate worker error:',
                error
              );

              Alert.alert(
                'Error',
                'Failed to deactivate this worker.'
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleActivate = (
    worker: Worker
  ) => {
    Alert.alert(
      'Activate Worker',
      `Activate ${worker.name} again?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              setActionLoading(worker._id);

              const updatedWorker =
                await activateWorker(
                  worker._id
                );

              setWorkers((current) =>
                current.map((item) =>
                  item._id === worker._id
                    ? updatedWorker
                    : item
                )
              );

              Alert.alert(
                'Worker Activated',
                `${worker.name} is active again.`
              );
            } catch (error) {
              console.error(
                'Activate worker error:',
                error
              );

              Alert.alert(
                'Error',
                'Failed to activate this worker.'
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = (
    worker: Worker
  ) => {
    router.push({
      pathname:
        '/worker/[id]',
      params: {
        id: worker._id,
      },
    });
  };

  const getInitials = (
    name: string
  ) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const filters = [
    {
      key: 'all' as Filter,
      label: 'All',
      count: workers.length,
    },
    {
      key: 'pending' as Filter,
      label: 'Pending',
      count: pendingCount,
    },
    {
      key: 'approved' as Filter,
      label: 'Approved',
      count: approvedCount,
    },
    {
      key: 'inactive' as Filter,
      label: 'Inactive',
      count: inactiveCount,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading workers...
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
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Workers
            </Text>

            <Text style={styles.subtitle}>
              Manage and approve service workers
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Feather
              name="tool"
              size={21}
              color="#fff"
            />
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>

          <Stat
            label="Total"
            value={workers.length}
            colors={colors}
            icon="users"
          />

          <Stat
            label="Pending"
            value={pendingCount}
            colors={colors}
            icon="clock"
          />

          <Stat
            label="Active"
            value={approvedCount}
            colors={colors}
            icon="check-circle"
          />

          <Stat
            label="Inactive"
            value={inactiveCount}
            colors={colors}
            icon="slash"
          />

        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Feather
            name="search"
            size={18}
            color={colors.mutedForeground}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search workers..."
            placeholderTextColor={
              colors.mutedForeground
            }
            style={styles.searchInput}
            autoCapitalize="none"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={10}
            >
              <Feather
                name="x"
                size={18}
                color={
                  colors.mutedForeground
                }
              />
            </Pressable>
          )}
        </View>

        {/* FILTERS */}
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) =>
            item.key
          }
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterContent
          }
          style={styles.filterList}
          renderItem={({ item }) => {
            const selected =
              filter === item.key;

            return (
              <Pressable
                onPress={() =>
                  setFilter(item.key)
                }
                style={[
                  styles.filterButton,
                  selected &&
                    styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected &&
                      styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>

                <View
                  style={[
                    styles.filterCount,
                    selected &&
                      styles.filterCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      selected &&
                        styles.filterCountTextActive,
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />

        {/* WORKERS */}
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) =>
            item._id
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={[
            styles.list,
            filteredWorkers.length === 0 &&
              styles.emptyList,
            { paddingBottom: Platform.OS === 'web' ? 120 : 90 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                fetchWorkers(true)
              }
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const profile =
              item.workerProfile;

            const isPending =
              !item.approved;

            const isInactive =
              item.approved &&
              !item.isActive;

            const isActionLoading =
              actionLoading === item._id;

            return (
              <View style={styles.card}>

                {/* TOP */}
                <View style={styles.cardTop}>

                  <View style={styles.avatar}>
                    <Text
                      style={
                        styles.avatarText
                      }
                    >
                      {getInitials(
                        item.name
                      )}
                    </Text>
                  </View>

                  <View
                    style={styles.workerInfo}
                  >
                    <View
                      style={
                        styles.nameRow
                      }
                    >
                      <Text
                        style={
                          styles.workerName
                        }
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                      {profile?.verified && (
                        <Feather
                          name="check-circle"
                          size={15}
                          color={
                            colors.success
                          }
                        />
                      )}
                    </View>

                    <Text
                      style={styles.phone}
                    >
                      {item.phone}
                    </Text>

                    <Text
                      style={styles.email}
                      numberOfLines={1}
                    >
                      {item.email}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.approvalBadge,
                      {
                        backgroundColor:
                          isPending
                            ? `${colors.accent}18`
                            : isInactive
                              ? `${colors.muted}20`
                              : `${colors.success}18`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.approvalText,
                        {
                          color:
                            isPending
                              ? colors.accent
                              : isInactive
                                ? colors.mutedForeground
                                : colors.success,
                        },
                      ]}
                    >
                      {isPending
                        ? 'Pending'
                        : isInactive
                          ? 'Inactive'
                          : 'Approved'}
                    </Text>
                  </View>

                </View>

                <View
                  style={styles.divider}
                />

                {/* SKILLS */}
                <View
                  style={styles.detailRow}
                >
                  <Feather
                    name="briefcase"
                    size={15}
                    color={
                      colors.mutedForeground
                    }
                  />

                  <Text
                    style={styles.detailText}
                    numberOfLines={2}
                  >
                    {profile?.skills
                      ?.length
                      ? profile.skills.join(
                          ' • '
                        )
                      : 'No professions added'}
                  </Text>
                </View>

                {/* EXPERIENCE */}
                <View
                  style={styles.detailRow}
                >
                  <Feather
                    name="clock"
                    size={15}
                    color={
                      colors.mutedForeground
                    }
                  />

                  <Text
                    style={styles.detailText}
                  >
                    {profile?.experience ??
                      0}{' '}
                    years experience
                  </Text>

                  <View
                    style={[
                      styles.availability,
                      {
                        backgroundColor:
                          profile?.availability ===
                          'available'
                            ? `${colors.success}18`
                            : `${colors.muted}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityText,
                        {
                          color:
                            profile?.availability ===
                            'available'
                              ? colors.success
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {profile?.availability ??
                        'offline'}
                    </Text>
                  </View>
                </View>

                {/* RATING */}
                <View
                  style={styles.detailRow}
                >
                  <Feather
                    name="star"
                    size={15}
                    color={colors.accent}
                  />

                  <Text
                    style={styles.detailText}
                  >
                    {(
                      profile?.rating ??
                      0
                    ).toFixed(1)}{' '}
                    rating
                  </Text>

                  <Text
                    style={styles.reviews}
                  >
                    {profile?.totalReviews ??
                      0}{' '}
                    reviews
                  </Text>
                </View>

                {/* JOBS */}
                <View
                  style={styles.detailRow}
                >
                  <Feather
                    name="check-circle"
                    size={15}
                    color={
                      colors.mutedForeground
                    }
                  />

                  <Text
                    style={styles.detailText}
                  >
                    {profile?.completedJobs ??
                      0}{' '}
                    completed jobs
                  </Text>
                </View>

                {/* ACTIONS */}
                <View
                  style={styles.actions}
                >

                  <Pressable
                    style={[
                      styles.viewButton,
                    ]}
                    onPress={() =>
                      handleViewProfile(
                        item
                      )
                    }
                  >
                    <Feather
                      name="eye"
                      size={16}
                      color={
                        colors.primary
                      }
                    />

                    <Text
                      style={
                        styles.viewText
                      }
                    >
                      View Profile
                    </Text>
                  </Pressable>

                  {isPending && (
                    <Pressable
                      disabled={
                        isActionLoading
                      }
                      style={[
                        styles.approveButton,
                        isActionLoading &&
                          styles.disabled,
                      ]}
                      onPress={() =>
                        handleApprove(
                          item
                        )
                      }
                    >
                      {isActionLoading ? (
                        <ActivityIndicator
                          size="small"
                          color="#fff"
                        />
                      ) : (
                        <>
                          <Feather
                            name="check"
                            size={16}
                            color="#fff"
                          />

                          <Text
                            style={
                              styles.approveText
                            }
                          >
                            Approve
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}

                  {!isPending &&
                    !isInactive && (
                      <Pressable
                        disabled={
                          isActionLoading
                        }
                        style={[
                          styles.deactivateButton,
                          isActionLoading &&
                            styles.disabled,
                        ]}
                        onPress={() =>
                          handleDeactivate(
                            item
                          )
                        }
                      >
                        {isActionLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={
                              colors.destructive
                            }
                          />
                        ) : (
                          <>
                            <Feather
                              name="slash"
                              size={16}
                              color={
                                colors.destructive
                              }
                            />

                            <Text
                              style={
                                styles.deactivateText
                              }
                            >
                              Deactivate
                            </Text>
                          </>
                        )}
                      </Pressable>
                    )}

                  {isInactive && (
                    <Pressable
                      disabled={
                        isActionLoading
                      }
                      style={[
                        styles.activateButton,
                        isActionLoading &&
                          styles.disabled,
                      ]}
                      onPress={() =>
                        handleActivate(
                          item
                        )
                      }
                    >
                      {isActionLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={
                            colors.success
                          }
                        />
                      ) : (
                        <>
                          <Feather
                            name="check-circle"
                            size={16}
                            color={
                              colors.success
                            }
                          />

                          <Text
                            style={
                              styles.activateText
                            }
                          >
                            Activate
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}

                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View
              style={styles.empty}
            >
              <View
                style={styles.emptyIcon}
              >
                <Feather
                  name="tool"
                  size={36}
                  color={colors.muted}
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                No workers found
              </Text>

              <Text
                style={styles.emptyText}
              >
                {search
                  ? 'Try another name, phone, email or profession.'
                  : 'There are no workers in this category.'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  colors,
  icon,
}: {
  label: string;
  value: number;
  colors: ReturnType<
    typeof useColors
  >;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
      }}
    >
      <Feather
        name={icon}
        size={15}
        color={colors.primary}
      />

      <Text
        style={{
          marginTop: 5,
          fontFamily: 'Inter_700Bold',
          fontSize: 18,
          color: colors.foreground,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          marginTop: 1,
          fontFamily:
            'Inter_400Regular',
          fontSize: 9,
          color:
            colors.mutedForeground,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useColors>
) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    container: {
      flex: 1,
      paddingHorizontal: 18,
    },

    header: {
      backgroundColor:
        colors.navy,
      marginHorizontal: -18,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 20,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    headerText: {
      flex: 1,
    },

    title: {
      color: '#fff',
      fontFamily:
        'Inter_700Bold',
      fontSize: 24,
    },

    subtitle: {
      color:
        'rgba(255,255,255,.72)',
      fontFamily:
        'Inter_400Regular',
      fontSize: 13,
      marginTop: 4,
    },

    headerIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        'rgba(255,255,255,.12)',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    statsRow: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 16,
    },

    searchBox: {
      height: 50,
      marginTop: 14,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },

    searchInput: {
      flex: 1,
      marginLeft: 10,
      color:
        colors.foreground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 14,
    },

    filterList: {
      flexGrow: 0,
      marginTop: 12,
    },

    filterContent: {
      gap: 8,
      paddingBottom: 2,
    },

    filterButton: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },

    filterButtonActive: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    filterText: {
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_500Medium',
      fontSize: 12,
    },

    filterTextActive: {
      color: '#fff',
    },

    filterCount: {
      minWidth: 19,
      height: 19,
      borderRadius: 10,
      marginLeft: 6,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.border,
    },

    filterCountActive: {
      backgroundColor:
        'rgba(255,255,255,.20)',
    },

    filterCountText: {
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 10,
    },

    filterCountTextActive: {
      color: '#fff',
    },

    list: {
      paddingTop: 12,
      paddingBottom: 35,
      gap: 12,
    },

    emptyList: {
      flexGrow: 1,
    },

    card: {
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 15,
      padding: 15,
    },

    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor:
        colors.primary,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    avatarText: {
      color: '#fff',
      fontFamily:
        'Inter_700Bold',
      fontSize: 15,
    },

    workerInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 6,
    },

    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    workerName: {
      flexShrink: 1,
      color:
        colors.foreground,
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 15,
    },

    phone: {
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 12,
      marginTop: 3,
    },

    email: {
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 11,
      marginTop: 2,
    },

    approvalBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 7,
    },

    approvalText: {
      fontFamily:
        'Inter_500Medium',
      fontSize: 10,
    },

    divider: {
      height: 1,
      backgroundColor:
        colors.border,
      marginVertical: 13,
    },

    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    detailText: {
      flex: 1,
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 12,
      marginLeft: 8,
    },

    reviews: {
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 11,
    },

    availability: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 6,
    },

    availabilityText: {
      fontFamily:
        'Inter_500Medium',
      fontSize: 10,
      textTransform:
        'capitalize',
    },

    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },

    viewButton: {
      flex: 1,
      height: 42,
      borderRadius: 9,
      backgroundColor:
        `${colors.primary}10`,
      borderWidth: 1,
      borderColor:
        `${colors.primary}30`,
      alignItems: 'center',
      justifyContent:
        'center',
      flexDirection: 'row',
      gap: 6,
    },

    viewText: {
      color:
        colors.primary,
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 12,
    },

    approveButton: {
      flex: 1,
      height: 42,
      borderRadius: 9,
      backgroundColor:
        colors.primary,
      alignItems: 'center',
      justifyContent:
        'center',
      flexDirection: 'row',
      gap: 6,
    },

    approveText: {
      color: '#fff',
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 12,
    },

    deactivateButton: {
      flex: 1,
      height: 42,
      borderRadius: 9,
      backgroundColor:
        '#FFF5F5',
      borderWidth: 1,
      borderColor:
        '#FED7D7',
      alignItems: 'center',
      justifyContent:
        'center',
      flexDirection: 'row',
      gap: 6,
    },

    deactivateText: {
      color:
        colors.destructive,
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 12,
    },

    activateButton: {
      flex: 1,
      height: 42,
      borderRadius: 9,
      backgroundColor:
        '#E9F7EF',
      borderWidth: 1,
      borderColor:
        '#C6F6D5',
      alignItems: 'center',
      justifyContent:
        'center',
      flexDirection: 'row',
      gap: 6,
    },

    activateText: {
      color:
        colors.success,
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 12,
    },

    disabled: {
      opacity: 0.6,
    },

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 12,
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 13,
    },

    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    emptyTitle: {
      color:
        colors.foreground,
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 16,
      marginTop: 12,
    },

    emptyText: {
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 13,
      marginTop: 5,
      textAlign: 'center',
      lineHeight: 19,
    },
  });
