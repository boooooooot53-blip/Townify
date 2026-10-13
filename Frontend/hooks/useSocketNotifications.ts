import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { Socket } from 'socket.io-client';

import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { initSocket, disconnectSocket, SOCKET_EVENTS } from '@/utils/socket';

export function useSocketNotifications() {
  const { user } = useAuth();
  const {
    fetchNotifications,
    fetchConversations,
    updateConversationHireStatus,
    fetchComplaints,
    fetchServiceRequests,
  } = useData();
  const socketRef = useRef<Socket | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      socketRef.current = null;
      return;
    }

    let mounted = true;

    async function connect() {
      try {
        const socket = await initSocket();
        if (!mounted) return;

        socketRef.current = socket;

        console.log(
          `[Socket] Connected as user_${user!.id}, socket id: ${socket.id}`,
        );

        const onNotification = (payload: any) => {
          console.log(
            '[Socket] RAW notification event: 😂',
            JSON.stringify(payload),
          );
          if (!mounted) return;
          fetchNotifications();
          fetchConversations();
          fetchComplaints();
          fetchServiceRequests();
        };

        const onHireStatusChanged = (payload: {
          roomId: string;
          hireStatus: string;
        }) => {
          console.log('[Socket] hire_status_changed received:', payload);
          if (!mounted) return;
          const status = payload.hireStatus as
            | 'pending'
            | 'accepted'
            | 'rejected';
          updateConversationHireStatus(payload.roomId, status);
          fetchConversations();
          fetchNotifications();
          fetchServiceRequests();
        };

        const onReconnect = () => {
          console.log('[Socket] Reconnected — refreshing data');
          if (!mounted) return;
          fetchNotifications();
          fetchConversations();
          fetchComplaints();
          fetchServiceRequests();
        };

        const onConnectError = (err: Error) => {
          console.warn('[Socket] connect_error:', err.message);
        };

        socket.on(SOCKET_EVENTS.NOTIFICATION, onNotification);
        socket.on(SOCKET_EVENTS.HIRE_STATUS_CHANGED, onHireStatusChanged);
        socket.on('reconnect', onReconnect);
        socket.on('connect_error', onConnectError);

        return () => {
          socket.off(SOCKET_EVENTS.NOTIFICATION, onNotification);
          socket.off(SOCKET_EVENTS.HIRE_STATUS_CHANGED, onHireStatusChanged);
          socket.off('reconnect', onReconnect);
          socket.off('connect_error', onConnectError);
        };
      } catch (err) {
        console.error('[Socket] Failed to connect:', err);
      }
    }

    let cleanup: (() => void) | undefined;
    connect().then((fn) => {
      cleanup = fn;
    });

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        next === 'active' &&
        mounted
      ) {
        connect().then((fn) => {
          cleanup?.();
          cleanup = fn;
        });
        fetchNotifications();
        fetchConversations();
        fetchComplaints();
        fetchServiceRequests();
      }
      appState.current = next;
    });

    return () => {
      mounted = false;
      cleanup?.();
      sub.remove();
    };
  }, [user?.id]);
}
