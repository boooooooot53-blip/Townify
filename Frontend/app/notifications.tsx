import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useData, Notification } from '@/context/DataContext';
import { Button, EmptyState } from '@/components/ThemedComponents';

const TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  complaint: 'alert-circle',
  quotation: 'file-text',
  chat: 'message-circle',
  sos: 'alert-octagon',
  general: 'bell',
  job: 'briefcase',
  hire_request: 'user-check',
  hire_response: 'user-check',
};

const TYPE_COLORS: Record<string, string> = {
  complaint: '#F59E0B',
  quotation: '#3B82F6',
  chat: '#10B981',
  sos: '#EF4444',
  general: '#6366F1',
  job: '#8B5CF6',
  hire_request: '#10B981',
  hire_response: '#10B981',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — derive the navigation target from a notification
// ─────────────────────────────────────────────────────────────────────────────
function getNotificationNavTarget(
  notification: Notification,
): { pathname: string; params: Record<string, string> } | null {
  const { type, data } = notification;

  // Hire request received by worker → open the chat room
  if (type === 'hire_request' && data?.chatRoomId) {
    return {
      pathname: '/chat-room',
      params: {
        conversationId: data.chatRoomId,
        roomId: data.chatRoomId,
      },
    };
  }

  // Hire response received by user (accepted or rejected) → open the chat room
  if (type === 'hire_response' && data?.chatRoomId) {
    return {
      pathname: '/chat-room',
      params: {
        conversationId: data.chatRoomId,
        roomId: data.chatRoomId,
      },
    };
  }

  // Regular chat notification → open the chat room
  if (type === 'chat' && data?.chatRoomId) {
    return {
      pathname: '/chat-room',
      params: {
        conversationId: data.chatRoomId,
        roomId: data.chatRoomId,
      },
    };
  }

  // Quotation notifications
  if (type === 'quotation') {
    // If it has a chatRoomId (e.g. accepted quotation), open the chat room
    if (data?.chatRoomId) {
      return {
        pathname: '/chat-room',
        params: {
          conversationId: data.chatRoomId,
          roomId: data.chatRoomId,
        },
      };
    }
    // New quotation received by the resident → navigate to worker profile
    if (data?.workerId) {
      return {
        pathname: '/worker-profile',
        params: {
          workerId: data.workerId,
        },
      };
    }
  }

  return null;
}

function NotificationItem({
  notification,
  onPress,
  onDelete,
}: {
  notification: Notification;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const colors = useColors();
  const iconColor = TYPE_COLORS[notification.type] ?? TYPE_COLORS.general;
  const icon = TYPE_ICONS[notification.type] ?? TYPE_ICONS.general;

  // Determine if tapping this notification should navigate somewhere
  const navTarget = getNotificationNavTarget(notification);

  const renderRightActions = () => {
    if (!onDelete) return null;
    return (
      <TouchableOpacity
        onPress={onDelete}
        style={{
          backgroundColor: colors.destructive,
          justifyContent: 'center',
          alignItems: 'flex-end',
          width: 80,
          paddingRight: 20,
        }}
      >
        <Feather name='trash-2' size={22} color='#fff' />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.item,
          {
            backgroundColor: notification.read
              ? colors.card
              : colors.primary + '08',
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: iconColor + '18' }]}
        >
          <Feather name={icon} size={20} color={iconColor} />
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: notification.read ? '500' : '700',
                color: colors.foreground,
                fontFamily: notification.read
                  ? 'Inter_500Medium'
                  : 'Inter_700Bold',
                marginRight: 8,
              }}
            >
              {notification.title}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
              }}
            >
              {timeAgo(notification.createdAt)}
            </Text>
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
            {notification.body}
          </Text>

          {/* "Tap to open chat" hint for hire notifications */}
          {navTarget && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 6,
                gap: 4,
              }}
            >
              <Feather name='message-circle' size={11} color={iconColor} />
              <Text
                style={{
                  fontSize: 11,
                  color: iconColor,
                  fontFamily: 'Inter_500Medium',
                }}
              >
                Tap to open chat
              </Text>
            </View>
          )}
        </View>

        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginLeft: 8 }}>
          {!notification.read ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary, marginBottom: 8 }]} />
          ) : (
            <View style={{ height: 8, marginBottom: 8 }} />
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    notificationsState,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useData();

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Handle tap on a notification ────────────────────────────────────────
  function handleNotificationPress(notification: Notification) {
    // Always mark as read
    markNotificationRead(notification.id);

    // Navigate based on notification type
    const target = getNotificationNavTarget(notification);
    if (target) {
      router.push({
        pathname: target.pathname as any,
        params: target.params,
      });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
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
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllNotificationsRead}>
            <Text
              style={{
                fontSize: 13,
                color: colors.accent,
                fontFamily: 'Inter_500Medium',
              }}
            >
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {notificationsState.loading && notifications.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      ) : null}

      {notificationsState.error ? (
        <View
          style={{
            margin: 20,
            padding: 12,
            backgroundColor: colors.destructive + '15',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.destructive }}>
            {notificationsState.error}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onDelete={() => handleDelete(item.id)}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Platform.OS === 'web' ? 60 : 40,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={
              <Feather
                name='bell-off'
                size={32}
                color={colors.mutedForeground}
              />
            }
            title='No notifications'
            description="You're all caught up! Notifications will appear here."
          />
        }
      />
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
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
});
