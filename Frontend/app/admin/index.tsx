
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { getDashboard, type AdminDashboard } from '@/api/admin';
import api from '@/api/axios';

type PendingUser = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'resident' | 'worker' | 'admin';
  approved: boolean;
  profileImage?: string | null;
  createdAt: string;
};

type RecentComplaint = {
  _id: string;
  title: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  user?: {
    name: string;
  };
  assignedTo?: {
    name: string;
  };
  assignmentStatus?: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
};

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<
    RecentComplaint[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setError('');

      const result = await getDashboard();
      setDashboard(result);

      // Optional endpoints for the dashboard lists.
      // Remove these if your backend doesn't have them yet.
      try {
        const [usersResponse, complaintsResponse] = await Promise.all([
          api.get('/admin/users', {
            params: {
              approved: false,
              limit: 5,
            },
          }),

          api.get('/complains', {
            params: {
              limit: 5,
              sort: '-createdAt',
            },
          }),
        ]);

        setPendingUsers(
          usersResponse.data?.data?.users ??
            usersResponse.data?.data ??
            [],
        );

        setRecentComplaints(
          complaintsResponse.data?.data?.complaints ??
            complaintsResponse.data?.data ??
            [],
        );
      } catch {
        // Dashboard statistics still work if list endpoints aren't available.
      }
    } catch (err: any) {
      console.log('Dashboard error:', err);

      setError(
        err?.response?.data?.message ||
          'Failed to load dashboard',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  async function approveUser(userId: string) {
    try {
      setApprovingId(userId);

      await api.patch(`/admin/users/${userId}/approval`, {
        approved: true,
      });

      setPendingUsers((previous) =>
        previous.filter((user) => user._id !== userId),
      );

      setDashboard((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          users: {
            ...previous.users,
            pending: Math.max(0, previous.users.pending - 1),
            approved: previous.users.approved + 1,
          },
        };
      });
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message ||
          'Failed to approve user',
      );
    } finally {
      setApprovingId(null);
    }
  }

  function confirmApproveUser(user: PendingUser) {
    Alert.alert(
      'Approve User',
      `Are you sure you want to approve ${user.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: () => approveUser(user._id),
        },
      ],
    );
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'resolved':
        return colors.success;

      case 'rejected':
        return colors.destructive;

      case 'in_progress':
        return colors.accent;

      default:
        return colors.primary;
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent':
        return colors.destructive;

      case 'high':
        return colors.accent;

      case 'medium':
        return colors.primary;

      default:
        return colors.mutedForeground;
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.loadingIcon,
            {
              backgroundColor: colors.primary + '15',
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>

        <Text
          style={[
            styles.loadingText,
            {
              color: colors.foreground,
            },
          ]}
        >
          Loading Dashboard
        </Text>

        <Text
          style={[
            styles.loadingSubText,
            {
              color: colors.mutedForeground,
            },
          ]}
        >
          Please wait...
        </Text>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.errorIcon,
            {
              backgroundColor: colors.destructive + '15',
            },
          ]}
        >
          <Feather
            name="alert-circle"
            size={32}
            color={colors.destructive}
          />
        </View>

        <Text
          style={[
            styles.loadingText,
            {
              color: colors.foreground,
            },
          ]}
        >
          Something went wrong
        </Text>

        <Text
          style={[
            styles.loadingSubText,
            {
              color: colors.mutedForeground,
            },
          ]}
        >
          {error || 'Unable to load dashboard'}
        </Text>

        <TouchableOpacity
          onPress={loadDashboard}
          style={[
            styles.retryButton,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Feather
            name="refresh-cw"
            size={16}
            color="#FFFFFF"
          />

          <Text style={styles.retryText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { users, complaints } = dashboard;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* ─────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────── */}

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.navy,
            paddingTop: insets.top + 14,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerEyebrow}>
              ADMIN PANEL
            </Text>

            <Text style={styles.headerTitle}>
              Dashboard
            </Text>

            <Text style={styles.headerSubtitle}>
              Manage your community
            </Text>
          </View>

          <TouchableOpacity
            onPress={onRefresh}
            style={styles.headerButton}
            activeOpacity={0.8}
          >
            <Feather
              name="refresh-cw"
              size={19}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Header summary */}
       
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 30,
        }}
      >
        {/* Error */}
        {error ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor:
                  colors.destructive + '10',
                borderColor:
                  colors.destructive + '25',
              },
            ]}
          >
            <Feather
              name="alert-circle"
              size={16}
              color={colors.destructive}
            />

            <Text
              style={[
                styles.errorBannerText,
                {
                  color: colors.destructive,
                },
              ]}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* ─────────────────────────────────────────────
            STAT CARDS
        ───────────────────────────────────────────── */}

        <View style={styles.section}>
          <SectionTitle
            title="Overview"
            icon="grid"
            colors={colors}
          />

          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={users.total}
              subtitle={`${users.active} active`}
              icon="users"
              color={colors.primary}
              colors={colors}
              onPress={() =>
                 router.push('/admin/users')
                }
            
            />

            <StatCard
              title="Complaints"
              value={complaints.total}
              subtitle={`${complaints.pending} pending`}
              icon="alert-circle"
              color={colors.accent}
              colors={colors}
                onPress={() =>
                 router.push('/admin/complaints?filter=pending')
              }
             
            />

            <StatCard
              title="Pending Approval"
              value={users.pending}
              subtitle="Needs review"
              icon="user-check"
              color={colors.primary}
              colors={colors}
              onPress={() =>
                 router.push('/admin/users?filter=pending')
              }
            />

            <StatCard
              title="Resolved"
              value={complaints.resolved}
              subtitle="Complaints resolved"
              icon="check-circle"
              color={colors.success}
              colors={colors}
              onPress={() =>
                router.push(
                  '/admin/complaints?filter=resolved',
                )
              }
            />
          </View>
        </View>

        {/* ─────────────────────────────────────────────
            USERS
        ───────────────────────────────────────────── */}

        <View style={styles.section}>
          <SectionTitle
            title="Users"
            icon="users"
            colors={colors}
            actionLabel="View All"
            onAction={() =>
              router.push('/admin/users')
            }
          />

          <View
            style={[
              styles.largeCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <UserStatRow
              icon="users"
              label="All Users"
              value={users.total}
              colors={colors}
              color={colors.primary}
              onPress={() =>
              router.push('/admin/users')
              }
            />

            <Divider colors={colors} />

            <UserStatRow
              icon="home"
              label="Residents"
              value={users.residents}
              colors={colors}
              color={colors.accent}
              onPress={() =>
                router.push('/admin/users?filter=residents')
              }
            />

            <Divider colors={colors} />

            <UserStatRow
              icon="tool"
              label="Workers"
              value={users.workers}
              colors={colors}
              color={colors.success}
                onPress={() =>
              router.push('/admin/users?filter=workers')
              }
            />

            <Divider colors={colors} />

            <UserStatRow
              icon="check-circle"
              label="Approved"
              value={users.approved}
              colors={colors}
              color={colors.success}
                onPress={() =>
              router.push('/admin/users?filter=approved')
              }
            />

            <Divider colors={colors} />

            <UserStatRow
              icon="clock"
              label="Pending Approval"
              value={users.pending}
              colors={colors}
              color={colors.primary}
              highlight
              onPress={() =>
              router.push('/admin/users?filter=pending')
              }
            />
          </View>
        </View>

        {/* ─────────────────────────────────────────────
            PENDING APPROVALS
        ───────────────────────────────────────────── */}

        {pendingUsers.length > 0 && (
          <View style={styles.section}>
            <SectionTitle
              title="Pending Approvals"
              icon="user-check"
              colors={colors}
              badge={users.pending}
              actionLabel="View All"
              onAction={() =>
                router.push('/admin/users?filter=pending')
              }
            />

            <View
              style={[
                styles.largeCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {pendingUsers.map((user, index) => (
                <React.Fragment key={user._id}>
                  <PendingUserRow
                    user={user}
                    colors={colors}
                    approving={
                      approvingId === user._id
                    }
                    onApprove={() =>
                      confirmApproveUser(user)
                    }
                    onPress={() =>
                      router.push(`/admin/users/${user._id}`)
                    }
                  />

                  {index <
                    pendingUsers.length - 1 && (
                    <Divider colors={colors} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* ─────────────────────────────────────────────
            COMPLAINTS
        ───────────────────────────────────────────── */}

        <View style={styles.section}>
          <SectionTitle
            title="Complaints"
            icon="alert-triangle"
            colors={colors}
            actionLabel="View All"
            onAction={() =>
              router.push('/admin/complaints')
            }
          />

          <View
            style={[
              styles.largeCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ComplaintStatusRow
              icon="clock"
              label="Pending"
              value={complaints.pending}
              color={colors.primary}
              colors={colors}
               onPress={() =>
                      router.push(`/admin/complaints?filter=pending`)
                    }
            />

            <Divider colors={colors} />

            <ComplaintStatusRow
              icon="loader"
              label="In Progress"
              value={complaints.inProgress}
              color={colors.accent}
              colors={colors}
                onPress={() =>
                      router.push(`/admin/complaints?filter=in_progress`)
                    }
            />

            <Divider colors={colors} />

            <ComplaintStatusRow
              icon="check-circle"
              label="Resolved"
              value={complaints.resolved}
              color={colors.success}
              colors={colors}
                onPress={() =>
                      router.push(`/admin/complaints?filter=resolved`)
                    }
            />

            <Divider colors={colors} />

            <ComplaintStatusRow
              icon="x-circle"
              label="Rejected"
              value={complaints.rejected}
              color={colors.destructive}
              colors={colors}
                onPress={() =>
                      router.push(`/admin/complaints?filter=rejected`)
                    }
            />

            <Divider colors={colors} />

            <ComplaintStatusRow
              icon="alert-octagon"
              label="Urgent"
              value={complaints.urgent}
              color={colors.destructive}
              colors={colors}
              highlight
                onPress={() =>
                      router.push(`/admin/complaints?filter=urgent`)
                    }
            />
          </View>
        </View>

        {/* ─────────────────────────────────────────────
            CATEGORY BREAKDOWN
        ───────────────────────────────────────────── */}

        <View style={styles.section}>
          <SectionTitle
            title="Complaints by Category"
            icon="bar-chart-2"
            colors={colors}
          />

          <View
            style={[
              styles.largeCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {dashboard.complaintsByCategory.map(
              (item, index) => {
                const percentage =
                  complaints.total > 0
                    ? Math.round(
                        (item.count /
                          complaints.total) *
                          100,
                      )
                    : 0;

                return (
                  <View
                    key={item.category}
                    style={{
                      marginBottom:
                        index ===
                        dashboard
                          .complaintsByCategory
                          .length -
                          1
                          ? 0
                          : 18,
                    }}
                  >
                    <View style={styles.categoryHeader}>
                      <Text
                        style={[
                          styles.categoryName,
                          {
                            color: colors.foreground,
                          },
                        ]}
                      >
                        {formatCategory(
                          item.category,
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.categoryCount,
                          {
                            color:
                              colors.mutedForeground,
                          },
                        ]}
                      >
                        {item.count} ({percentage}%)
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.progressBackground,
                        {
                          backgroundColor:
                            colors.muted,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor:
                              colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              },
            )}

            {dashboard.complaintsByCategory.length ===
              0 && (
              <EmptyState
                icon="bar-chart-2"
                title="No complaint data"
                colors={colors}
              />
            )}
          </View>
        </View>

        {/* ─────────────────────────────────────────────
            RECENT COMPLAINTS
        ───────────────────────────────────────────── */}

        {recentComplaints.length > 0 && (
          <View style={styles.section}>
            <SectionTitle
              title="Recent Complaints"
              icon="file-text"
              colors={colors}
              actionLabel="View All"
              onAction={() => router.push('/admin/complaints')}
            />

            <View
              style={[
                styles.largeCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {recentComplaints.map(
                (complaint, index) => (
                  <React.Fragment
                    key={complaint._id}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({
                          pathname: '/complaint/[id]',
                          params: { id: complaint._id }
                        })
                      }
                      style={styles.complaintRow}
                    >
                      <View
                        style={[
                          styles.complaintIcon,
                          {
                            backgroundColor:
                              getPriorityColor(
                                complaint.priority,
                              ) + '15',
                          },
                        ]}
                      >
                        <Feather
                          name="alert-circle"
                          size={18}
                          color={getPriorityColor(
                            complaint.priority,
                          )}
                        />
                      </View>

                      <View
                        style={styles.complaintContent}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.complaintTitle,
                            {
                              color:
                                colors.foreground,
                            },
                          ]}
                        >
                          {complaint.title}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.complaintMeta,
                            {
                              color:
                                colors.mutedForeground,
                            },
                          ]}
                        >
                          {formatCategory(
                            complaint.category,
                          )}
                          {' • '}
                          {formatDate(
                            complaint.createdAt,
                          )}
                        </Text>

                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                getStatusColor(
                                  complaint.status,
                                ) + '12',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  getStatusColor(
                                    complaint.status,
                                  ),
                              },
                            ]}
                          >
                            {formatStatus(
                              complaint.status,
                            )}
                          </Text>
                        </View>
                        
                        {/* Worker Rejection Info */}
                        {complaint.assignmentStatus === 'rejected' && (
                          <View style={{ marginTop: 6, backgroundColor: colors.destructive + '15', padding: 6, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.destructive, fontFamily: 'Inter_600SemiBold', marginBottom: 2 }}>
                              Rejected by {complaint.assignedTo?.name || 'Worker'}
                            </Text>
                            <Text style={{ fontSize: 10, color: colors.destructive, fontFamily: 'Inter_400Regular' }}>
                              Reason: {complaint.rejectionReason || 'No reason'}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Feather
                        name="chevron-right"
                        size={18}
                        color={
                          colors.mutedForeground
                        }
                      />
                    </TouchableOpacity>

                    {index <
                      recentComplaints.length -
                        1 && (
                      <Divider colors={colors} />
                    )}
                  </React.Fragment>
                ),
              )}
            </View>
          </View>
        )}

        {/* ─────────────────────────────────────────────
            QUICK ACTIONS
        ───────────────────────────────────────────── */}

        <View style={styles.section}>
          <SectionTitle
            title="Quick Actions"
            icon="zap"
            colors={colors}
          />

          <View style={styles.quickGrid}>
            <QuickAction
              icon="users"
              title="All Users"
              color={colors.primary}
              colors={colors}
              onPress={() => router.push('/admin/users')}
            />

            <QuickAction
              icon="user-check"
              title="Approvals"
              color={colors.accent}
              badge={users.pending}
              colors={colors}
              onPress={() =>
                router.push('/admin/users?filter=pending')
              }
            />

            <QuickAction
              icon="alert-triangle"
              title="Complaints"
              color={colors.destructive}
              colors={colors}
              onPress={() => router.push('/admin/complaints')}
            />

          
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────────────────
   SECTION TITLE
───────────────────────────────────────────────────── */

function SectionTitle({
  title,
  icon,
  colors,
  actionLabel,
  onAction,
  badge,
}: {
  title: string;
  icon: any;
  colors: any;
  actionLabel?: string;
  onAction?: () => void;
  badge?: number;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleLeft}>
        <View
          style={[
            styles.sectionIcon,
            {
              backgroundColor:
                colors.primary + '12',
            },
          ]}
        >
          <Feather
            name={icon}
            size={15}
            color={colors.primary}
          />
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          {title}
        </Text>

        {badge !== undefined && badge > 0 && (
          <View
            style={[
              styles.sectionBadge,
              {
                backgroundColor:
                  colors.destructive + '15',
              },
            ]}
          >
            <Text
              style={[
                styles.sectionBadgeText,
                {
                  color: colors.destructive,
                },
              ]}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>

      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.viewAllText,
              {
                color: colors.primary,
              },
            ]}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────── */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  colors,
  onPress,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: any;
  color: string;
  colors: any;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: color + '15',
          },
        ]}
      >
        <Feather
          name={icon}
          size={20}
          color={color}
        />
      </View>

      <Text
        style={[
          styles.statTitle,
          {
            color: colors.mutedForeground,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.statValue,
          {
            color: colors.foreground,
          },
        ]}
      >
        {value.toLocaleString()}
      </Text>

      <Text
        style={[
          styles.statSubtitle,
          {
            color,
          },
        ]}
      >
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────────────
   USER STAT ROW
───────────────────────────────────────────────────── */

function UserStatRow({
  icon,
  label,
  value,
  color,
  colors,
  highlight,
  onPress,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  colors: any;
  highlight?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statRow,
        highlight && {
          backgroundColor: color + '08',
          marginHorizontal: -4,
          paddingHorizontal: 4,
          borderRadius: 10,
        },
        pressed && {
          opacity: 0.7,
        },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: color + '12',
          },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={color}
        />
      </View>

      <Text
        style={[
          styles.rowLabel,
          {
            color: colors.foreground,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.rowValue,
          {
            color: colors.foreground,
          },
        ]}
      >
        {value.toLocaleString()}
      </Text>

      <Feather
        name="chevron-right"
        size={16}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────
   COMPLAINT STATUS ROW
───────────────────────────────────────────────────── */

function ComplaintStatusRow({
  icon,
  label,
  value,
  color,
  colors,
  highlight,
  onPress,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  colors: any;
  highlight?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statRow,
        highlight && {
          backgroundColor: color + '08',
          marginHorizontal: -4,
          paddingHorizontal: 4,
          borderRadius: 10,
        },
        pressed && {
          opacity: 0.7,
        },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: color + '12',
          },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={color}
        />
      </View>

      <Text
        style={[
          styles.rowLabel,
          {
            color: colors.foreground,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.rowValue,
          {
            color,
          },
        ]}
      >
        {value.toLocaleString()}
      </Text>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────
   PENDING USER
───────────────────────────────────────────────────── */

function PendingUserRow({
  user,
  colors,
  approving,
  onApprove,
  onPress,
}: {
  user: PendingUser;
  colors: any;
  approving: boolean;
  onApprove: () => void;
  onPress: () => void;
}) {
  return (
    <View style={styles.pendingUser}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.pendingUserMain}
      >
        <View
          style={[
            styles.userAvatar,
            {
              backgroundColor:
                colors.primary + '15',
            },
          ]}
        >
          <Text
            style={[
              styles.userAvatarText,
              {
                color: colors.primary,
              },
            ]}
          >
            {user.name
              ?.charAt(0)
              .toUpperCase() || 'U'}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text
            numberOfLines={1}
            style={[
              styles.userName,
              {
                color: colors.foreground,
              },
            ]}
          >
            {user.name}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.userEmail,
              {
                color: colors.mutedForeground,
              },
            ]}
          >
            {user.email}
          </Text>

          <View style={styles.userRole}>
            <Text
              style={[
                styles.userRoleText,
                {
                  color: colors.primary,
                },
              ]}
            >
              {user.role}
            </Text>

            <Text
              style={[
                styles.userDate,
                {
                  color: colors.mutedForeground,
                },
              ]}
            >
              {' • '}
              {formatDate(user.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={approving}
        onPress={onApprove}
        activeOpacity={0.75}
        style={[
          styles.approveButton,
          {
            backgroundColor:
              colors.success + '12',
          },
        ]}
      >
        {approving ? (
          <ActivityIndicator
            size="small"
            color={colors.success}
          />
        ) : (
          <Feather
            name="check"
            size={17}
            color={colors.success}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ─────────────────────────────────────────────────────
   QUICK ACTION
───────────────────────────────────────────────────── */

function QuickAction({
  icon,
  title,
  color,
  colors,
  badge,
  onPress,
}: {
  icon: any;
  title: string;
  color: string;
  colors: any;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.quickAction,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor: color + '15',
          },
        ]}
      >
        <Feather
          name={icon}
          size={19}
          color={color}
        />
      </View>

      <Text
        style={[
          styles.quickTitle,
          {
            color: colors.foreground,
          },
        ]}
      >
        {title}
      </Text>

      {badge !== undefined && badge > 0 && (
        <View
          style={[
            styles.quickBadge,
            {
              backgroundColor:
                colors.destructive,
            },
          ]}
        >
          <Text style={styles.quickBadgeText}>
            {badge}
          </Text>
        </View>
      )}

      <Feather
        name="chevron-right"
        size={15}
        color={colors.mutedForeground}
      />
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────── */

function EmptyState({
  icon,
  title,
  colors,
}: {
  icon: any;
  title: string;
  colors: any;
}) {
  return (
    <View style={styles.emptyState}>
      <Feather
        name={icon}
        size={28}
        color={colors.mutedForeground}
      />

      <Text
        style={[
          styles.emptyText,
          {
            color: colors.mutedForeground,
          },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

/* ─────────────────────────────────────────────────────
   DIVIDER
───────────────────────────────────────────────────── */

function Divider({ colors }: { colors: any }) {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.border,
        },
      ]}
    />
  );
}

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */

function formatCategory(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function formatStatus(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

/* ─────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  loadingSubText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 20,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  header: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerEyebrow: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },

  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSummary: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  headerSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },

  headerSummaryNumber: {
    fontSize: 19,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },

  headerSummaryLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
  },

  headerDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  errorBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },

  section: {
    marginTop: 22,
    paddingHorizontal: 16,
  },

  sectionTitleRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  sectionBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  statCard: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 145,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  statTitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },

  statValue: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },

  statSubtitle: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginTop: 3,
  },

  largeCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    overflow: 'hidden',
  },

  statRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },

  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  divider: {
    height: 1,
    width: '100%',
  },

  pendingUser: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  pendingUserMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  userAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  userEmail: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },

  userRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  userRoleText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'capitalize',
  },

  userDate: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
  },

  approveButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  complaintRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  complaintIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  complaintContent: {
    flex: 1,
  },

  complaintTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  complaintMeta: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 5,
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },

  categoryCount: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },

  progressBackground: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  quickGrid: {
    gap: 9,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
  },

  quickAction: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: Platform.OS === 'web' ? 1 : undefined,
    minWidth: Platform.OS === 'web' ? 220 : '100%',
  },

  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  quickBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
    gap: 8,
  },

  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});

