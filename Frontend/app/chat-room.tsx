import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageViewer from 'react-native-image-zoom-viewer';

import * as chatApi from '@/api/chat';
import { getErrorMessage } from '@/api/axios';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useData, ChatMessage, ChatConversation } from '@/context/DataContext';
import { mapMessage, mapChatRoom } from '@/utils/mappers';
import { getSocket, initSocket, SOCKET_EVENTS } from '@/utils/socket';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Avatar component: shows profile image or fallback initial ───────────────
function Avatar({
  name,
  imageUrl,
  size = 44,
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
        backgroundColor: colors.accent,
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
            fontSize: size * 0.4,
            fontWeight: '700',
            color: '#FFF',
            fontFamily: 'Inter_700Bold',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hire Request Bubble
// ─────────────────────────────────────────────────────────────────────────────
function HireRequestBubble({
  message,
  isWorker,
  hireStatus,
  onAccept,
  onReject,
}: {
  message: ChatMessage;
  isWorker: boolean;
  hireStatus: string | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  const colors = useColors();
  const effectiveStatus = hireStatus ?? 'pending';
  const isResolved =
    effectiveStatus === 'accepted' || effectiveStatus === 'rejected';

  const cardBorderColor =
    effectiveStatus === 'accepted'
      ? colors.success + '50'
      : effectiveStatus === 'rejected'
        ? colors.destructive + '40'
        : colors.primary + '40';

  const cardBg =
    effectiveStatus === 'accepted'
      ? colors.success + '10'
      : effectiveStatus === 'rejected'
        ? colors.destructive + '08'
        : colors.primary + '08';

  const iconName =
    effectiveStatus === 'accepted'
      ? 'check-circle'
      : effectiveStatus === 'rejected'
        ? 'x-circle'
        : 'user-check';

  const iconColor =
    effectiveStatus === 'accepted'
      ? colors.success
      : effectiveStatus === 'rejected'
        ? colors.destructive
        : colors.primary;

  const statusLabel =
    effectiveStatus === 'accepted'
      ? 'Hire Request Accepted'
      : effectiveStatus === 'rejected'
        ? 'Hire Request Declined'
        : 'Hire Request';

  const statusSub =
    effectiveStatus === 'accepted'
      ? 'You can now chat freely'
      : effectiveStatus === 'rejected'
        ? 'This request was declined'
        : isWorker
          ? 'Respond to this request below'
          : 'Awaiting worker response';

  return (
    <View style={[styles.bubbleWrapper, { justifyContent: 'center' }]}>
      <View
        style={[
          styles.hireCard,
          { backgroundColor: cardBg, borderColor: cardBorderColor },
        ]}
      >
        <View style={styles.hireCardHeader}>
          <View
            style={[
              styles.hireIconCircle,
              { backgroundColor: iconColor + '20' },
            ]}
          >
            <Feather name={iconName as any} size={18} color={iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hireCardTitle, { color: iconColor }]}>
              {statusLabel}
            </Text>
            <Text
              style={[styles.hireCardSub, { color: colors.mutedForeground }]}
            >
              {statusSub}
            </Text>
          </View>
        </View>

        <Text style={[styles.hireCardMsg, { color: colors.foreground }]}>
          {message.text}
        </Text>
        <Text style={[styles.hireCardTime, { color: colors.mutedForeground }]}>
          {formatTime(message.timestamp)}
        </Text>

        {isWorker && !isResolved && (
          <View style={styles.hireActions}>
            <TouchableOpacity
              onPress={onReject}
              style={[
                styles.hireRejectBtn,
                {
                  borderColor: colors.destructive + '50',
                  backgroundColor: colors.destructive + '10',
                },
              ]}
            >
              <Feather name='x' size={14} color={colors.destructive} />
              <Text style={[styles.hireBtnText, { color: colors.destructive }]}>
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAccept}
              style={[
                styles.hireAcceptBtn,
                { backgroundColor: colors.success },
              ]}
            >
              <Feather name='check' size={14} color='#FFF' />
              <Text style={[styles.hireBtnText, { color: '#FFF' }]}>
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!isWorker && !isResolved && (
          <View
            style={[
              styles.hirePendingBadge,
              { backgroundColor: colors.primary + '12' },
            ]}
          >
            <Feather name='clock' size={12} color={colors.primary} />
            <Text style={[styles.hirePendingText, { color: colors.primary }]}>
              Waiting for worker response
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System message bubble
// ─────────────────────────────────────────────────────────────────────────────
function SystemBubble({ message }: { message: ChatMessage }) {
  const colors = useColors();
  const isAccepted = message.type === 'hire_accepted';
  const isRejected = message.type === 'hire_rejected';

  const color = isAccepted
    ? colors.success
    : isRejected
      ? colors.destructive
      : colors.mutedForeground;
  const bg = isAccepted
    ? colors.success + '10'
    : isRejected
      ? colors.destructive + '08'
      : colors.muted;
  const border = isAccepted
    ? colors.success + '30'
    : isRejected
      ? colors.destructive + '25'
      : colors.border;
  const icon = isAccepted ? 'check-circle' : isRejected ? 'x-circle' : 'info';

  return (
    <View style={[styles.bubbleWrapper, { justifyContent: 'center' }]}>
      <View
        style={[
          styles.systemBubble,
          { backgroundColor: bg, borderColor: border },
        ]}
      >
        <Feather name={icon as any} size={13} color={color} />
        <Text style={[styles.systemBubbleText, { color }]}>{message.text}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Regular text bubble
// ─────────────────────────────────────────────────────────────────────────────
function TextBubble({
  message,
  isMine,
  onDelete,
}: {
  message: ChatMessage;
  isMine: boolean;
  onDelete?: (messageId: string) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.bubbleWrapper,
        { justifyContent: isMine ? 'flex-end' : 'flex-start' },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => { if (isMine && onDelete) onDelete(message.id); }}
        delayLongPress={500}
        style={[
          styles.bubble,
          {
            backgroundColor: isMine ? colors.primary : colors.card,
            borderColor: isMine ? colors.primary : colors.border,
            borderWidth: isMine ? 0 : 1,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 15,
            color: isMine ? '#FFFFFF' : colors.foreground,
            fontFamily: 'Inter_400Regular',
            lineHeight: 22,
          }}
        >
          {message.text}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: isMine ? 'rgba(255,255,255,0.65)' : colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
            alignSelf: 'flex-end',
            marginTop: 4,
          }}
        >
          {formatTime(message.timestamp)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Deleted Bubble
// ─────────────────────────────────────────────────────────────────────────────
function DeletedBubble({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.bubbleWrapper,
        { justifyContent: isMine ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMine ? colors.primary + '40' : colors.card,
            borderColor: isMine ? 'transparent' : colors.border,
            borderWidth: isMine ? 0 : 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="slash" size={14} color={isMine ? 'rgba(255,255,255,0.7)' : colors.mutedForeground} />
          <Text style={{ fontSize: 14, color: isMine ? 'rgba(255,255,255,0.7)' : colors.mutedForeground, fontStyle: 'italic', fontFamily: 'Inter_400Regular' }}>
            This message was deleted
          </Text>
        </View>
        <Text style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.5)' : colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 4 }}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image bubble
// ─────────────────────────────────────────────────────────────────────────────
function ImageBubble({
  message,
  isMine,
  onDelete,
  onPressImage,
}: {
  message: ChatMessage;
  isMine: boolean;
  onDelete?: (messageId: string) => void;
  onPressImage?: (url: string) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.bubbleWrapper,
        { justifyContent: isMine ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMine ? colors.primary : colors.card,
            borderColor: isMine ? colors.primary : colors.border,
            borderWidth: isMine ? 0 : 1,
            paddingHorizontal: 8,
            paddingVertical: 8,
            position: 'relative',
          },
        ]}
      >
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => { if (onPressImage && message.mediaUrl) onPressImage(message.mediaUrl); }}
          onLongPress={() => { if (isMine && onDelete) onDelete(message.id); }}
          delayLongPress={500}
        >
          <Image
            source={{ uri: message.mediaUrl }}
            style={{ width: 220, height: 220, borderRadius: 12 }}
            resizeMode='cover'
          />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, gap: 10, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 10,
              color: isMine ? 'rgba(255,255,255,0.8)' : colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
            }}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Finalize Price Bubble
// ─────────────────────────────────────────────────────────────────────────────
function FinalizePriceBubble({
  message,
  isWorker,
  isMine,
  onAccept,
  onReject,
}: {
  message: ChatMessage;
  isWorker: boolean;
  isMine: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const colors = useColors();
  const price = message.text; // the text is the price amount

  return (
    <View style={[styles.bubbleWrapper, { justifyContent: 'center' }]}>
      <View
        style={[
          styles.hireCard,
          { backgroundColor: colors.accent + '10', borderColor: colors.accent + '40' },
        ]}
      >
        <View style={styles.hireCardHeader}>
          <View
            style={[
              styles.hireIconCircle,
              { backgroundColor: colors.accent + '20' },
            ]}
          >
            <Feather name='tag' size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hireCardTitle, { color: colors.accent }]}>
              Finalized Price Quoted
            </Text>
            <Text
              style={[styles.hireCardSub, { color: colors.mutedForeground }]}
            >
              {isWorker ? 'You sent a finalized price.' : 'Worker wants to finalize the price.'}
            </Text>
          </View>
        </View>

        <Text style={[styles.hireCardMsg, { color: colors.foreground, fontSize: 18, fontWeight: 'bold' }]}>
          Rs. {price}
        </Text>
        <Text style={[styles.hireCardTime, { color: colors.mutedForeground }]}>
          {formatTime(message.timestamp)}
        </Text>

        {!isWorker && (
          <View style={styles.hireActions}>
            <TouchableOpacity
              onPress={onReject}
              style={[
                styles.hireRejectBtn,
                {
                  borderColor: colors.destructive + '50',
                  backgroundColor: colors.destructive + '10',
                },
              ]}
            >
              <Feather name='x' size={14} color={colors.destructive} />
              <Text style={[styles.hireBtnText, { color: colors.destructive }]}>
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAccept}
              style={[
                styles.hireAcceptBtn,
                { backgroundColor: colors.success },
              ]}
            >
              <Feather name='check' size={14} color='#FFF' />
              <Text style={[styles.hireBtnText, { color: '#FFF' }]}>
                Agree
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message dispatcher
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isMine,
  isWorker,
  hireStatus,
  onAcceptHire,
  onRejectHire,
  onAcceptPrice,
  onRejectPrice,
  onDeleteMessage,
  onPressImage,
}: {
  message: ChatMessage;
  isMine: boolean;
  isWorker: boolean;
  hireStatus: string | null;
  onAcceptHire: () => void;
  onRejectHire: () => void;
  onAcceptPrice: (msg: ChatMessage) => void;
  onRejectPrice: (msg: ChatMessage) => void;
  onDeleteMessage?: (msgId: string) => void;
  onPressImage?: (url: string) => void;
}) {
  if (message.isDeleted) {
    return <DeletedBubble message={message} isMine={isMine} />;
  }

  if (message.type === 'hire_request') {
    return (
      <HireRequestBubble
        message={message}
        isWorker={isWorker}
        hireStatus={hireStatus}
        onAccept={onAcceptHire}
        onReject={onRejectHire}
      />
    );
  }
  if (message.type === 'finalize_price') {
    return (
      <FinalizePriceBubble
        message={message}
        isWorker={isWorker}
        isMine={isMine}
        onAccept={() => onAcceptPrice(message)}
        onReject={() => onRejectPrice(message)}
      />
    );
  }
  if (message.type === 'image') {
    return <ImageBubble message={message} isMine={isMine} onDelete={onDeleteMessage} onPressImage={onPressImage} />;
  }
  if (
    message.type === 'hire_accepted' ||
    message.type === 'hire_rejected' ||
    message.type === 'price_accepted' ||
    message.type === 'price_rejected' ||
    message.type === 'system'
  ) {
    return <SystemBubble message={message} />;
  }
  return <TextBubble message={message} isMine={isMine} onDelete={onDeleteMessage} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatRoomScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversationId, roomId } = useLocalSearchParams<{
    conversationId?: string;
    roomId?: string;
  }>();
  const activeRoomId = roomId ?? conversationId ?? '';

  const { user } = useAuth();
  const {
    conversations,
    fetchMessages,
    fetchConversations,
    respondToHireRequest,
    updateConversationHireStatus,
    deleteMessage,
  } = useData();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const [localConversation, setLocalConversation] =
    useState<ChatConversation | null>(null);

  const [localHireStatus, setLocalHireStatus] = useState<
    'pending' | 'accepted' | 'rejected' | null | undefined
  >(undefined);

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const flatListRef = useRef<FlatList>(null);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const conversation =
    conversations.find((c) => c.id === activeRoomId) ?? localConversation;
  const isWorker = user?.role === 'worker';

  useEffect(() => {
    if (conversation && localHireStatus === undefined) {
      setLocalHireStatus(conversation.hireStatus ?? null);
    }
  }, [conversation, localHireStatus]);

  useEffect(() => {
    if (localHireStatus === undefined && messages.length > 0) {
      const hasHireRequest = messages.some((m) => m.type === 'hire_request');
      const hasAccepted = messages.some((m) => m.type === 'hire_accepted');
      const hasRejected = messages.some((m) => m.type === 'hire_rejected');
      if (hasAccepted) {
        setLocalHireStatus('accepted');
      } else if (hasRejected) {
        setLocalHireStatus('rejected');
      } else if (hasHireRequest) {
        setLocalHireStatus('pending');
      } else {
        setLocalHireStatus(null);
      }
    }
  }, [messages, localHireStatus]);

  const effectiveHireStatus =
    localHireStatus === undefined ? null : localHireStatus;

  const isHireChat =
    effectiveHireStatus !== null ||
    messages.some((m) => m.type === 'hire_request');

  const canSend = (() => {
    if (localHireStatus === undefined) return false;
    if (!isHireChat) return true;
    if (effectiveHireStatus === 'accepted') return true;
    return false;
  })();

  // ── Whether to show the send button ───────────────────────────────────────
  const hasText = inputText.trim().length > 0;
  const isInputValid = hasText || !!selectedImageBase64;

  // ── Socket + data loading ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRoomId || !user) return;
    let mounted = true;

    const setup = async () => {
      setLoading(true);
      setError('');
      try {
        const loaded = await fetchMessages(activeRoomId);
        if (mounted) setMessages(loaded);

        const conversationInContext = conversations.find(
          (c) => c.id === activeRoomId,
        );

        if (!conversationInContext) {
          const [, roomResult] = await Promise.allSettled([
            fetchConversations(),
            chatApi.getChatRoomById(activeRoomId),
          ]);

          if (
            mounted &&
            roomResult.status === 'fulfilled' &&
            roomResult.value &&
            user
          ) {
            const mapped = mapChatRoom(roomResult.value, user.id);
            setLocalConversation(mapped);
            if (localHireStatus === undefined) {
              setLocalHireStatus(mapped.hireStatus ?? null);
            }
          }
        }

        await chatApi.markAsRead(activeRoomId);

        const socket = await initSocket();
        if (!mounted) return;

        socket.emit(SOCKET_EVENTS.JOIN_ROOM, activeRoomId);
        socket.emit(SOCKET_EVENTS.MARK_READ, activeRoomId);

        const onNewMessage = (payload: { message: any; roomId: string }) => {
          if (payload.roomId !== activeRoomId || !user) return;
          const mapped = mapMessage(payload.message, user.id);
          setMessages((prev) =>
            prev.some((m) => m.id === mapped.id) ? prev : [...prev, mapped],
          );
          fetchConversations();
        };

        const onHireStatusChanged = (payload: {
          roomId: string;
          hireStatus: string;
        }) => {
          if (payload.roomId !== activeRoomId) return;
          const status = payload.hireStatus as
            | 'pending'
            | 'accepted'
            | 'rejected';
          setLocalHireStatus(status);
          updateConversationHireStatus(activeRoomId, status);
          fetchMessages(activeRoomId).then((loaded) => {
            if (mounted) setMessages(loaded);
          });
        };

        socket.on(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
        socket.on(SOCKET_EVENTS.HIRE_STATUS_CHANGED, onHireStatusChanged);

        return () => {
          socket.off(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
          socket.off(SOCKET_EVENTS.HIRE_STATUS_CHANGED, onHireStatusChanged);
          socket.emit(SOCKET_EVENTS.LEAVE_ROOM, activeRoomId);
        };
      } catch (err) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    let cleanup: (() => void) | undefined;
    setup().then((fn) => {
      cleanup = fn;
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [activeRoomId, user]);

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Conversation not found ─────────────────────────────────────────────────
  if (!loading && !conversation) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>
          {error || 'Conversation not found'}
        </Text>
      </View>
    );
  }

  const userId = user?.id ?? '';

  // ── Send message ───────────────────────────────────────────────────────────
  async function handleSend() {
    if ((!inputText.trim() && !selectedImageBase64) || !user || !canSend) return;
    const text = inputText.trim() || 'Image';
    const hasImage = !!selectedImageBase64;
    const imageBase64 = selectedImageBase64;
    
    setInputText('');
    setSelectedImage(null);
    setSelectedImageBase64(null);
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      let saved;
      if (hasImage) {
        const dataUri = `data:image/jpeg;base64,${imageBase64}`;
        saved = await chatApi.sendMessage(activeRoomId, text, 'image', dataUri);
      } else {
        saved = await chatApi.sendMessage(activeRoomId, text);
      }
      const mapped = mapMessage(saved, user.id);
      setMessages((prev) =>
        prev.some((m) => m.id === mapped.id) ? prev : [...prev, mapped],
      );
      await fetchConversations();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  }

  // ── Hire response handlers ─────────────────────────────────────────────────
  function handleAcceptHire() {
    Alert.alert(
      'Accept Hire Request',
      'By accepting you agree to work with this resident. They will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setResponding(true);
            try {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
              await respondToHireRequest(activeRoomId, true);
              setLocalHireStatus('accepted');
              updateConversationHireStatus(activeRoomId, 'accepted');
              const loaded = await fetchMessages(activeRoomId);
              setMessages(loaded);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to accept hire request.');
            } finally {
              setResponding(false);
            }
          },
        },
      ],
    );
  }

  function handleRejectHire() {
    Alert.alert(
      'Decline Hire Request',
      'The resident will be notified that you are unavailable for this job.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setResponding(true);
            try {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              ).catch(() => {});
              await respondToHireRequest(activeRoomId, false);
              setLocalHireStatus('rejected');
              updateConversationHireStatus(activeRoomId, 'rejected');
              const loaded = await fetchMessages(activeRoomId);
              setMessages(loaded);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to decline hire request.');
            } finally {
              setResponding(false);
            }
          },
        },
      ],
    );
  }

  // ── Finalize Price handlers ────────────────────────────────────────────────
  function handleFinalizePrice() {
    Alert.prompt(
      'Finalize Price',
      'Enter the agreed price for the job (in Rs.):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Quote',
          onPress: async (price) => {
            if (!price || !user) return;
            setSending(true);
            try {
              const saved = await chatApi.sendMessage(activeRoomId, price, 'finalize_price');
              const mapped = mapMessage(saved, user.id);
              setMessages((prev) => [...prev, mapped]);
              await fetchConversations();
            } catch (err) {
              Alert.alert('Error', 'Failed to send finalized price.');
            } finally {
              setSending(false);
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  }

  async function handleAcceptPrice(msg: ChatMessage) {
    if (!user) return;
    try {
      const saved = await chatApi.sendMessage(activeRoomId, `Resident accepted the price of Rs. ${msg.text}`, 'price_accepted');
      const mapped = mapMessage(saved, user.id);
      setMessages((prev) => [...prev, mapped]);
    } catch (err) {
      Alert.alert('Error', 'Failed to accept price.');
    }
  }

  async function handleRejectPrice(msg: ChatMessage) {
    if (!user) return;
    try {
      const saved = await chatApi.sendMessage(activeRoomId, 'Resident rejected the price.', 'price_rejected');
      const mapped = mapMessage(saved, user.id);
      setMessages((prev) => [...prev, mapped]);
    } catch (err) {
      Alert.alert('Error', 'Failed to reject price.');
    }
  }

  function handleDeleteMessage(messageId: string) {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message for everyone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!activeRoomId) return;
            try {
              await deleteMessage(activeRoomId, messageId);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === messageId
                    ? { ...m, isDeleted: true, text: 'This message was deleted', type: 'text', mediaUrl: undefined }
                    : m
                )
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to delete message.');
            }
          },
        },
      ]
    );
  }

  // ── Image Picker ───────────────────────────────────────────────────────────
  async function pickImage() {
    if (!user || !canSend) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (!asset.base64) return;
      setSelectedImage(asset.uri);
      setSelectedImageBase64(asset.base64);
    }
  }

  if (!conversation) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior='padding'
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.navy,
          paddingTop: topInset + 12,
          paddingHorizontal: 16,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name='arrow-left' size={20} color='#FFFFFF' />
        </TouchableOpacity>

        {/* Avatar: image if available, else initial */}
        <Avatar
          name={conversation.participantName}
          imageUrl={conversation.participantAvatar}
          size={44}
          colors={colors}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#FFFFFF',
              fontFamily: 'Inter_700Bold',
            }}
          >
            {conversation.participantName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.accent,
              fontFamily: 'Inter_400Regular',
            }}
          >
            {conversation.participantRole}
          </Text>
        </View>

        {effectiveHireStatus === 'accepted' && (
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: colors.success + '20' },
            ]}
          >
            <Feather name='check-circle' size={11} color={colors.success} />
            <Text style={[styles.headerBadgeText, { color: colors.success }]}>
              Hired
            </Text>
          </View>
        )}
        {effectiveHireStatus === 'rejected' && (
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: colors.destructive + '15' },
            ]}
          >
            <Feather name='x-circle' size={11} color={colors.destructive} />
            <Text
              style={[styles.headerBadgeText, { color: colors.destructive }]}>
              Declined
            </Text>
          </View>
        )}
        {effectiveHireStatus === 'pending' && (
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: colors.primary + '15' },
            ]}
          >
            <Feather name='clock' size={11} color={colors.primary} />
            <Text style={[styles.headerBadgeText, { color: colors.primary }]}>
              Pending
            </Text>
          </View>
        )}
      </View>

      {/* Error bar */}
      {error ? (
        <View
          style={{ padding: 12, backgroundColor: colors.destructive + '15' }}
        >
          <Text
            style={{
              color: colors.destructive,
              fontFamily: 'Inter_400Regular',
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      {/* Responding overlay */}
      {responding && (
        <View
          style={{
            padding: 10,
            backgroundColor: colors.muted,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
          }}
        >
          <ActivityIndicator size='small' color={colors.primary} />
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Processing...
          </Text>
        </View>
      )}

      {/* Message list — inverted so it always opens at the latest message */}
      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMine={item.senderId === userId}
            isWorker={isWorker}
            hireStatus={effectiveHireStatus}
            onAcceptHire={handleAcceptHire}
            onRejectHire={handleRejectHire}
            onAcceptPrice={handleAcceptPrice}
            onRejectPrice={handleRejectPrice}
            onDeleteMessage={handleDeleteMessage}
            onPressImage={setViewerImage}
          />
        )}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
      />

      {/* ── Input area (WhatsApp-style pill bar) ─────────────────────────────── */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: keyboardVisible ? 8 : bottomInset + 8,
          },
        ]}
      >
        {canSend ? (
          <View style={[styles.inputRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
            {isWorker && (!isHireChat || effectiveHireStatus === 'accepted') && (
              <TouchableOpacity
                onPress={handleFinalizePrice}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.accent + '20',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Feather name='tag' size={14} color={colors.accent} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>
                  Finalize Price
                </Text>
              </TouchableOpacity>
            )}
            {selectedImage && (
              <View style={{ marginBottom: 12, position: 'relative', alignSelf: 'flex-start' }}>
                <Image 
                  source={{ uri: selectedImage }} 
                  style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: colors.border }} 
                />
                <TouchableOpacity
                  onPress={() => {
                    setSelectedImage(null);
                    setSelectedImageBase64(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: colors.destructive,
                    borderRadius: 12,
                    padding: 4,
                  }}
                >
                  <Feather name="x" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={pickImage} style={[styles.sendBtn, { backgroundColor: colors.muted }]}>
                <Feather name='camera' size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background,
                    borderColor: hasText ? colors.primary + '60' : colors.border,
                  },
                ]}
              >
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder='Type a message...'
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.textInput,
                  { color: colors.foreground, fontFamily: 'Inter_400Regular' },
                ]}
                multiline
                maxLength={500}
                onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
                returnKeyType='send'
              />
            </View>
            {/* Send button — only visible once the user has typed something or selected an image */}
            {isInputValid && (
              <TouchableOpacity
                onPress={handleSend}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: sending
                      ? colors.primary + '80'
                      : colors.primary,
                  },
                ]}
                disabled={sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator color='#FFFFFF' size='small' />
                ) : (
                  <Feather name='send' size={18} color='#FFFFFF' />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        ) : (
          <View
            style={[
              styles.blockedNotice,
              {
                backgroundColor:
                  effectiveHireStatus === 'rejected'
                    ? colors.destructive + '08'
                    : colors.primary + '08',
                borderColor:
                  effectiveHireStatus === 'rejected'
                    ? colors.destructive + '25'
                    : colors.primary + '25',
              },
            ]}
          >
            <Feather
              name={effectiveHireStatus === 'rejected' ? 'slash' : 'clock'}
              size={14}
              color={
                effectiveHireStatus === 'rejected'
                  ? colors.destructive
                  : colors.primary
              }
            />
            <Text
              style={[
                styles.blockedText,
                {
                  color:
                    effectiveHireStatus === 'rejected'
                      ? colors.destructive
                      : colors.primary,
                },
              ]}
            >
              {effectiveHireStatus === 'rejected'
                ? 'Messaging disabled — hire request was declined.'
                : isWorker
                  ? 'Accept or decline the hire request above to start messaging.'
                  : 'Waiting for the worker to accept your request.'}
            </Text>
          </View>
        )}
      </View>

      <Modal 
        visible={!!viewerImage} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {viewerImage && (
            <ImageViewer
              imageUrls={[{ url: viewerImage }]}
              enableSwipeDown={true}
              onSwipeDown={() => setViewerImage(null)}
              onClick={() => setViewerImage(null)}
              renderIndicator={() => <View />}
              backgroundColor="#000"
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  headerBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  bubbleWrapper: { flexDirection: 'row', marginVertical: 3 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  hireCard: {
    width: '92%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 6,
  },
  hireCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  hireIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  hireCardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  hireCardMsg: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 6,
  },
  hireCardTime: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  hireActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  hireRejectBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hireAcceptBtn: {
    flex: 2,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hireBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  hirePendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  hirePendingText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '85%',
    marginVertical: 4,
  },
  systemBubbleText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  inputContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 90,
    justifyContent: 'center',
  },
  textInput: { fontSize: 14, lineHeight: 18, maxHeight: 74, padding: 0 },
  // Circular send button — only rendered once the user has typed something.
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  blockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  blockedText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
