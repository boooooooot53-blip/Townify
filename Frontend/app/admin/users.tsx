import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
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

import {
  activateUser,
  approveUser,
  deactivateUser,
  getUsers,
  type User,
} from '@/api/user';

import { useColors } from '@/hooks/useColors';

type Filter = 'all' | 'pending' | 'approved' | 'inactive';

export default function AdminUsersScreen() {
  const colors = useColors();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const { filter: filterParam } = useLocalSearchParams<{
    filter?: Filter;
  }>();

  const [filter, setFilter] = useState<Filter>(
    filterParam || 'all'
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const styles = createStyles(colors);

  // ─────────────────────────────────────────────
  // Fetch users
  // ─────────────────────────────────────────────

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getUsers();

      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);

      Alert.alert(
        'Error',
        'Unable to load users. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─────────────────────────────────────────────
  // Counts
  // ─────────────────────────────────────────────

  const pendingCount = useMemo(
    () => users.filter((user) => !user.approved).length,
    [users],
  );

  const approvedCount = useMemo(
    () =>
      users.filter(
        (user) => user.approved && user.isActive,
      ).length,
    [users],
  );

  const inactiveCount = useMemo(
    () =>
      users.filter(
        (user) => user.approved && !user.isActive,
      ).length,
    [users],
  );

  // ─────────────────────────────────────────────
  // Search + Filter
  // ─────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query);

      let matchesFilter = true;

      switch (filter) {
        case 'pending':
          matchesFilter = !user.approved;
          break;

        case 'approved':
          matchesFilter =
            user.approved && user.isActive;
          break;

        case 'inactive':
          matchesFilter =
            user.approved && !user.isActive;
          break;

        case 'all':
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  // ─────────────────────────────────────────────
  // Approve User
  // ─────────────────────────────────────────────

  const handleApprove = async (user: User) => {
    try {
      setActionLoading(user._id);

      const updatedUser = await approveUser(user._id);

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item._id === user._id
            ? updatedUser
            : item,
        ),
      );

      Alert.alert(
        'User Approved',
        `${user.name} has been approved successfully.`,
      );
    } catch (error) {
      console.error('Approve user error:', error);

      Alert.alert(
        'Error',
        'Failed to approve this user. Please try again.',
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ─────────────────────────────────────────────
  // Reject User
  // ─────────────────────────────────────────────
  //
  // Your current backend does not have a reject endpoint.
  // For now this simply explains that rejection isn't available.
  //
  // If you want rejection, add a rejected field/status to
  // your backend instead of deleting the user.
  // ─────────────────────────────────────────────

  const handleReject = (user: User) => {
    Alert.alert(
      'Reject User',
      `There is currently no reject API configured for ${user.name}.`,
      [
        {
          text: 'OK',
          style: 'cancel',
        },
      ],
    );
  };

  // ─────────────────────────────────────────────
  // Deactivate User
  // ─────────────────────────────────────────────

  const handleDeactivate = (user: User) => {
    Alert.alert(
      'Deactivate Profile',
      `Are you sure you want to deactivate ${user.name}'s profile?\n\nThe user will no longer be able to access the application.`,
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
              setActionLoading(user._id);

              const updatedUser =
                await deactivateUser(user._id);

              setUsers((currentUsers) =>
                currentUsers.map((item) =>
                  item._id === user._id
                    ? updatedUser
                    : item,
                ),
              );

              Alert.alert(
                'Profile Deactivated',
                `${user.name}'s profile has been deactivated.`,
              );
            } catch (error) {
              console.error(
                'Deactivate user error:',
                error,
              );

              Alert.alert(
                'Error',
                'Failed to deactivate this user. Please try again.',
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // ─────────────────────────────────────────────
  // Activate User
  // ─────────────────────────────────────────────

  const handleActivate = (user: User) => {
    Alert.alert(
      'Activate Profile',
      `Do you want to activate ${user.name}'s profile again?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Activate',

          onPress: async () => {
            try {
              setActionLoading(user._id);

              const updatedUser =
                await activateUser(user._id);

              setUsers((currentUsers) =>
                currentUsers.map((item) =>
                  item._id === user._id
                    ? updatedUser
                    : item,
                ),
              );

              Alert.alert(
                'Profile Activated',
                `${user.name}'s profile is active again.`,
              );
            } catch (error) {
              console.error(
                'Activate user error:',
                error,
              );

              Alert.alert(
                'Error',
                'Failed to activate this user. Please try again.',
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // ─────────────────────────────────────────────
  // User Details
  // ─────────────────────────────────────────────

  const handleViewProfile = (user: User) => {
    Alert.alert(
      user.name,
      [
        `Email: ${user.email}`,
        `Phone: ${user.phone}`,
        `Role: ${user.role}`,
        `Approval: ${user.approved
          ? 'Approved'
          : 'Pending'
        }`,
        `Status: ${user.isActive
          ? 'Active'
          : 'Inactive'
        }`,
      ].join('\n'),
    );
  };

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getUserStatus = (user: User) => {
    if (!user.approved) {
      return 'pending';
    }

    if (!user.isActive) {
      return 'inactive';
    }

    return 'approved';
  };

  // ─────────────────────────────────────────────
  // Filter Button
  // ─────────────────────────────────────────────

  const filterItems: {
    key: Filter;
    label: string;
    count?: number;
  }[] = [
      {
        key: 'all',
        label: 'All',
        count: users.length,
      },
      {
        key: 'pending',
        label: 'Pending',
        count: pendingCount,
      },
      {
        key: 'approved',
        label: 'Approved',
        count: approvedCount,
      },
      {
        key: 'inactive',
        label: 'Inactive',
        count: inactiveCount,
      },
    ];

  // ─────────────────────────────────────────────
  // Loading Screen
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading users...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────
  // Main UI
  // ─────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              User Management
            </Text>

            <Text style={styles.subtitle}>
              Approve and manage registered users
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Feather
              name="users"
              size={21}
              color="#fff"
            />
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          {/* Pending */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.pendingIcon,
              ]}
            >
              <Feather
                name="clock"
                size={16}
                color="#B7791F"
              />
            </View>

            <View>
              <Text style={styles.statValue}>
                {pendingCount}
              </Text>

              <Text style={styles.statLabel}>
                Pending
              </Text>
            </View>
          </View>

          {/* Approved */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.approvedIcon,
              ]}
            >
              <Feather
                name="check-circle"
                size={16}
                color="#2F855A"
              />
            </View>

            <View>
              <Text style={styles.statValue}>
                {approvedCount}
              </Text>

              <Text style={styles.statLabel}>
                Active
              </Text>
            </View>
          </View>

          {/* Inactive */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.inactiveIcon,
              ]}
            >
              <Feather
                name="slash"
                size={16}
                color="#718096"
              />
            </View>

            <View>
              <Text style={styles.statValue}>
                {inactiveCount}
              </Text>

              <Text style={styles.statLabel}>
                Inactive
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Feather
            name="search"
            size={19}
            color={colors.mutedForeground}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, email or phone..."
            placeholderTextColor={
              colors.mutedForeground
            }
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={10}
            >
              <Feather
                name="x"
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <FlatList
          horizontal
          data={filterItems}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={styles.filterList}
          renderItem={({ item }) => {
            const isSelected =
              filter === item.key;

            return (
              <Pressable
                onPress={() =>
                  setFilter(item.key)
                }
                style={[
                  styles.filterButton,
                  isSelected &&
                  styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected &&
                    styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>

                {item.count !== undefined && (
                  <View
                    style={[
                      styles.filterCount,
                      isSelected &&
                      styles.filterCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        isSelected &&
                        styles.filterCountTextActive,
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />

        {/* Users */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            filteredUsers.length === 0 &&
            styles.emptyList,
            { paddingBottom: Platform.OS === 'web' ? 120 : 90 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                fetchUsers(true)
              }
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const status = getUserStatus(item);
            const isActionLoading =
              actionLoading === item._id;

            return (
              <View style={styles.card}>
                {/* User Information */}
                <View style={styles.userTop}>
                  <View style={styles.avatar}>
                    <Text
                      style={styles.avatarText}
                    >
                      {getInitials(item.name)}
                    </Text>
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text
                        style={styles.userName}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              item.isActive
                                ? colors.success
                                : colors.muted,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={styles.email}
                      numberOfLines={1}
                    >
                      {item.email}
                    </Text>

                    <Text style={styles.phone}>
                      {item.phone}
                    </Text>
                  </View>
                </View>

                {/* Status */}
                <View style={styles.metaRow}>
                  {/* Role */}
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {item.role}
                    </Text>
                  </View>

                  {/* Pending */}
                  {status === 'pending' && (
                    <View
                      style={[
                        styles.statusBadge,
                        styles.pendingBadge,
                      ]}
                    >
                      <Feather
                        name="clock"
                        size={11}
                        color="#B7791F"
                      />

                      <Text
                        style={[
                          styles.statusText,
                          styles.pendingText,
                        ]}
                      >
                        Pending Approval
                      </Text>
                    </View>
                  )}

                  {/* Approved */}
                  {status === 'approved' && (
                    <View
                      style={[
                        styles.statusBadge,
                        styles.approvedBadge,
                      ]}
                    >
                      <Feather
                        name="check-circle"
                        size={11}
                        color="#2F855A"
                      />

                      <Text
                        style={[
                          styles.statusText,
                          styles.approvedText,
                        ]}
                      >
                        Approved
                      </Text>
                    </View>
                  )}

                  {/* Inactive */}
                  {status === 'inactive' && (
                    <View
                      style={[
                        styles.statusBadge,
                        styles.inactiveBadge,
                      ]}
                    >
                      <Feather
                        name="slash"
                        size={11}
                        color="#718096"
                      />

                      <Text
                        style={[
                          styles.statusText,
                          styles.inactiveText,
                        ]}
                      >
                        Inactive
                      </Text>
                    </View>
                  )}
                </View>

                {/* Registration date */}
                {item.createdAt && (
                  <Text style={styles.createdText}>
                    Registered{' '}
                    {new Date(
                      item.createdAt,
                    ).toLocaleDateString()}
                  </Text>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                  {/* Pending */}
                  {status === 'pending' && (
                    <>
                      <Pressable
                        disabled={isActionLoading}
                        style={[
                          styles.actionButton,
                          styles.rejectButton,
                          isActionLoading &&
                          styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleReject(item)
                        }
                      >
                        <Feather
                          name="x"
                          size={16}
                          color="#C53030"
                        />

                        <Text
                          style={
                            styles.rejectButtonText
                          }
                        >
                          Reject
                        </Text>
                      </Pressable>

                      <Pressable
                        disabled={isActionLoading}
                        style={[
                          styles.actionButton,
                          styles.approveButton,
                          isActionLoading &&
                          styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleApprove(item)
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
                                styles.approveButtonText
                              }
                            >
                              Approve
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </>
                  )}

                  {/* Approved */}
                  {status === 'approved' && (
                    <>
                      <Pressable
                        style={[
                          styles.actionButton,
                          styles.viewButton,
                        ]}
                        onPress={() =>
                          handleViewProfile(item)
                        }
                      >
                        <Feather
                          name="eye"
                          size={16}
                          color={colors.primary}
                        />

                        <Text
                          style={
                            styles.viewButtonText
                          }
                        >
                          View Profile
                        </Text>
                      </Pressable>

                      <Pressable
                        disabled={isActionLoading}
                        style={[
                          styles.actionButton,
                          styles.deactivateButton,
                          isActionLoading &&
                          styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleDeactivate(item)
                        }
                      >
                        {isActionLoading ? (
                          <ActivityIndicator
                            size="small"
                            color="#C53030"
                          />
                        ) : (
                          <>
                            <Feather
                              name="slash"
                              size={16}
                              color="#C53030"
                            />

                            <Text
                              style={
                                styles.deactivateButtonText
                              }
                            >
                              Deactivate
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </>
                  )}

                  {/* Inactive */}
                  {status === 'inactive' && (
                    <>
                      <Pressable
                        style={[
                          styles.actionButton,
                          styles.viewButton,
                        ]}
                        onPress={() =>
                          handleViewProfile(item)
                        }
                      >
                        <Feather
                          name="eye"
                          size={16}
                          color={colors.primary}
                        />

                        <Text
                          style={
                            styles.viewButtonText
                          }
                        >
                          View Profile
                        </Text>
                      </Pressable>

                      <Pressable
                        disabled={isActionLoading}
                        style={[
                          styles.actionButton,
                          styles.activateButton,
                          isActionLoading &&
                          styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleActivate(item)
                        }
                      >
                        {isActionLoading ? (
                          <ActivityIndicator
                            size="small"
                            color="#2F855A"
                          />
                        ) : (
                          <>
                            <Feather
                              name="check-circle"
                              size={16}
                              color="#2F855A"
                            />

                            <Text
                              style={
                                styles.activateButtonText
                              }
                            >
                              Activate
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather
                  name="users"
                  size={38}
                  color={colors.muted}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No users found
              </Text>

              <Text style={styles.emptyText}>
                {search
                  ? 'Try searching with a different name, email or phone.'
                  : 'There are no users in this category.'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const createStyles = (
  colors: ReturnType<typeof useColors>,
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

    // Header
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

    headerTextContainer: {
      flex: 1,
      paddingRight: 10,
    },

    title: {
      fontFamily: 'Inter_700Bold',
      fontSize: 24,
      color: '#fff',
    },

    subtitle: {
      marginTop: 4,
      fontFamily: 'Inter_400Regular',
      color: 'rgba(255,255,255,0.72)',
      fontSize: 13,
    },

    headerIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(255,255,255,0.12)',
    },

    // Statistics
    statsContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
    },

    statCard: {
      flex: 1,
      minHeight: 68,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
    },

    statIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 7,
    },

    pendingIcon: {
      backgroundColor: '#FFF8E7',
    },

    approvedIcon: {
      backgroundColor: '#E9F7EF',
    },

    inactiveIcon: {
      backgroundColor: '#EDF2F7',
    },

    statValue: {
      color: colors.foreground,
      fontFamily: 'Inter_700Bold',
      fontSize: 17,
    },

    statLabel: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      marginTop: 1,
    },

    // Search
    searchBox: {
      marginTop: 14,
      height: 50,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },

    searchInput: {
      flex: 1,
      marginLeft: 10,
      color: colors.foreground,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
    },

    // Filters
    filterList: {
      flexGrow: 0,
      marginTop: 12,
    },

    filters: {
      gap: 8,
      paddingBottom: 2,
    },

    filterButton: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexDirection: 'row',
      alignItems: 'center',
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

    filterCount: {
      minWidth: 19,
      height: 50,
      borderRadius: 10,
      paddingHorizontal: 5,
      marginLeft: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.border,
    },

    filterCountActive: {
      backgroundColor:
        'rgba(255,255,255,0.20)',
    },

    filterCountText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 10,
    },

    filterCountTextActive: {
      color: '#fff',
    },

    // List
    list: {
      paddingTop: 12,
      paddingBottom: 35,
      gap: 10,
    },

    emptyList: {
      flexGrow: 1,
    },

    // Card
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
    },

    userTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      color: '#fff',
      fontFamily: 'Inter_700Bold',
      fontSize: 15,
    },

    userInfo: {
      flex: 1,
      marginLeft: 13,
    },

    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    userName: {
      flexShrink: 1,
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
    },

    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginLeft: 7,
    },

    email: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginTop: 4,
    },

    phone: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginTop: 2,
    },

    // Meta
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 12,
    },

    roleBadge: {
      backgroundColor: `${colors.primary}18`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },

    roleText: {
      color: colors.primary,
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
      textTransform: 'capitalize',
    },

    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },

    pendingBadge: {
      backgroundColor: '#FFF8E7',
    },

    approvedBadge: {
      backgroundColor: '#E9F7EF',
    },

    inactiveBadge: {
      backgroundColor: '#EDF2F7',
    },

    statusText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
    },

    pendingText: {
      color: '#B7791F',
    },

    approvedText: {
      color: '#2F855A',
    },

    inactiveText: {
      color: '#718096',
    },

    createdText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      marginTop: 8,
    },

    // Actions
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 13,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    actionButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 8,
    },

    disabledButton: {
      opacity: 0.6,
    },

    approveButton: {
      backgroundColor: colors.primary,
    },

    approveButtonText: {
      color: '#fff',
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },

    rejectButton: {
      backgroundColor: '#FFF5F5',
      borderWidth: 1,
      borderColor: '#FED7D7',
    },

    rejectButtonText: {
      color: '#C53030',
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },

    viewButton: {
      backgroundColor: `${colors.primary}10`,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },

    viewButtonText: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },

    deactivateButton: {
      backgroundColor: '#FFF5F5',
      borderWidth: 1,
      borderColor: '#FED7D7',
    },

    deactivateButtonText: {
      color: '#C53030',
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },

    activateButton: {
      backgroundColor: '#E9F7EF',
      borderWidth: 1,
      borderColor: '#C6F6D5',
    },

    activateButtonText: {
      color: '#2F855A',
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      marginTop: 12,
    },

    // Empty
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
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
      fontSize: 13,
      marginTop: 5,
      textAlign: 'center',
      lineHeight: 19,
    },
  });
