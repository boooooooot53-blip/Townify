import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useData, ChatConversation } from '@/context/DataContext';
import { EmptyState } from '@/components/ThemedComponents';

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60 * 1000) return 'now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Avatar component: shows profile image or fallback initial ───────────────
function Avatar({
  name,
  imageUrl,
  size = 54,
  colors,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  colors: any;
}) {
  const borderRadius = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: colors.primary + '18',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius }}
          resizeMode='cover'
        />
      ) : (
        <Text
          style={{
            fontSize: size * 0.33,
            fontWeight: '700',
            color: colors.primary,
            fontFamily: 'Inter_700Bold',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function ConversationItem({
  conv,
  onPress,
  onDelete,
}: {
  conv: ChatConversation;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const hasUnread = conv.unreadCount > 0;
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = React.useState(false);

  function handleSwipe() {
    if (swiped) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setSwiped(false);
    } else {
      Animated.spring(translateX, {
        toValue: -80,
        useNativeDriver: true,
      }).start();
      setSwiped(true);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Conversation',
      `Remove chat with ${conv.participantName}? You can hire them again later.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            setSwiped(false);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ],
    );
  }

  return (
    <View style={{ overflow: 'hidden' }}>
      {/* Delete button behind */}
      <View style={[styles.deleteBtn, { backgroundColor: colors.destructive }]}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtnInner}>
          <Feather name='trash-2' size={20} color='#FFF' />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable row */}
      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity
          onPress={() => {
            if (swiped) {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
              setSwiped(false);
            } else {
              onPress();
            }
          }}
          onLongPress={handleSwipe}
          activeOpacity={0.7}
          style={[
            styles.convItem,
            {
              backgroundColor: hasUnread ? colors.primary + '08' : colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          {/* Avatar with online dot */}
          <View style={{ marginRight: 14, position: 'relative' }}>
            <Avatar
              name={conv.participantName}
              imageUrl={(conv as any).participantAvatar}
              size={54}
              colors={colors}
            />
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: colors.success, borderColor: colors.card },
              ]}
            />
          </View>

          {/* Content */}
          <View style={{ flex: 1, marginRight: 8 }}>
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
                  fontWeight: hasUnread ? '700' : '600',
                  color: colors.foreground,
                  fontFamily: hasUnread ? 'Inter_700Bold' : 'Inter_600SemiBold',
                }}
              >
                {conv.participantName}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: hasUnread ? colors.primary : colors.mutedForeground,
                  fontFamily: hasUnread
                    ? 'Inter_500Medium'
                    : 'Inter_400Regular',
                }}
              >
                {formatTime(conv.lastMessageTime)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.primary,
                fontFamily: 'Inter_400Regular',
                marginTop: 1,
              }}
            >
              {conv.participantRole}
            </Text>

            {/* Hire status badge */}
            {conv.hireStatus && (
              <View style={{ flexDirection: 'row', marginTop: 3 }}>
                <View
                  style={[
                    styles.hireBadge,
                    {
                      backgroundColor:
                        conv.hireStatus === 'accepted'
                          ? colors.success + '20'
                          : conv.hireStatus === 'rejected'
                            ? colors.destructive + '15'
                            : colors.primary + '15',
                    },
                  ]}
                >
                  <Feather
                    name={
                      conv.hireStatus === 'accepted'
                        ? 'check-circle'
                        : conv.hireStatus === 'rejected'
                          ? 'x-circle'
                          : 'clock'
                    }
                    size={10}
                    color={
                      conv.hireStatus === 'accepted'
                        ? colors.success
                        : conv.hireStatus === 'rejected'
                          ? colors.destructive
                          : colors.primary
                    }
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Inter_500Medium',
                      color:
                        conv.hireStatus === 'accepted'
                          ? colors.success
                          : conv.hireStatus === 'rejected'
                            ? colors.destructive
                            : colors.primary,
                      marginLeft: 3,
                    }}
                  >
                    {conv.hireStatus === 'accepted'
                      ? 'Hired'
                      : conv.hireStatus === 'rejected'
                        ? 'Declined'
                        : 'Pending'}
                  </Text>
                </View>
              </View>
            )}

            <Text
              style={{
                fontSize: 13,
                color: hasUnread ? colors.foreground : colors.mutedForeground,
                fontFamily: hasUnread ? 'Inter_500Medium' : 'Inter_400Regular',
                marginTop: 3,
              }}
              numberOfLines={1}
            >
              {conv.lastMessage}
            </Text>
          </View>

          {/* Unread badge */}
          {hasUnread && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                {conv.unreadCount}
              </Text>
            </View>
          )}

          {/* Swipe hint */}
          {!swiped && (
            <Feather
              name='chevron-left'
              size={14}
              color={colors.mutedForeground}
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    conversations,
    conversationsState,
    fetchConversations,
    deleteConversation,
  } = useData();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const handleDelete = useCallback(
    async (roomId: string) => {
      try {
        await deleteConversation(roomId);
      } catch {
        Alert.alert('Error', 'Failed to delete conversation.');
      }
    },
    [deleteConversation],
  );

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
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            {totalUnread > 0 && (
              <Text style={styles.headerSubtitle}>
                {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      </View>

      {conversationsState.loading && conversations.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      ) : null}

      {conversationsState.error ? (
        <View
          style={{
            margin: 20,
            padding: 12,
            backgroundColor: colors.destructive + '15',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.destructive }}>
            {conversationsState.error}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conv={item}
            onPress={() =>
              router.push({
                pathname: '/chat-room',
                params: { conversationId: item.id, roomId: item.id },
              })
            }
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Platform.OS === 'web' ? 120 : 90,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={
              <Feather
                name='message-circle'
                size={32}
                color={colors.mutedForeground}
              />
            }
            title='No conversations yet'
            description='Accept a quotation or send a hire request to start chatting.'
          />
        }
      />

      {/* Swipe hint footer */}
      {conversations.length > 0 && (
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Long press a chat to reveal delete option
          </Text>
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
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  hireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
});
