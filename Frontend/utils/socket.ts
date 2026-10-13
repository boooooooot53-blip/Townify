import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/utils/storage';

import { Platform } from 'react-native';

const getSocketUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:5000`;
    }
    if (hostname) {
      return `http://${hostname}:5000`;
    }
  }
  return process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  TYPING: 'typing',
  USER_TYPING: 'user_typing',
  MARK_READ: 'mark_read',
  MESSAGES_READ: 'messages_read',
  SOS_ALERT: 'sos_alert',
  SOS_UPDATE: 'sos_update',
  ERROR: 'error',
  NOTIFICATION: 'notification',
  HIRE_STATUS_CHANGED: 'hire_status_changed',
} as const;

export async function initSocket(token?: string): Promise<Socket> {
  const authToken = token ?? (await getAccessToken());

  if (socket) {
    const existingToken = (socket.auth as any)?.token;
    if (socket.connected && existingToken === authToken) {
      return socket; // reuse if same token and already connected
    }
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL!, {
    auth: { token: authToken },
    // FIX 1: polling first so the HTTP handshake succeeds, then upgrades
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket not initialized'));

    socket.once('connect', () => {
      console.log('[Socket] Connected, id:', socket!.id);
      resolve(socket!);
    });

    socket.once('connect_error', (err) => {
      console.warn('[Socket] connect_error:', err.message);
      reject(err); 
    });
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
