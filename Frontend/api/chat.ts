import api from '@/api/axios';
import type { ApiResponse } from '@/api/types';

export async function getChatRooms(page = 1, limit = 20) {
  try {
    const { data } = await api.get<ApiResponse<{ rooms: any[] }>>(
      '/chat/rooms',
      { params: { page, limit } },
    );
    return data.data.rooms;
  } catch (error) {
    throw error;
  }
}

export async function getChatRoomById(id: string) {
  try {
    const { data } = await api.get<ApiResponse<{ room: any }>>(
      `/chat/rooms/${id}`,
    );
    return data.data.room;
  } catch (error) {
    throw error;
  }
}

export async function getMessages(roomId: string, page = 1, limit = 50) {
  try {
    const { data } = await api.get<ApiResponse<{ messages: any[] }>>(
      `/chat/rooms/${roomId}/messages`,
      { params: { page, limit } },
    );
    return data.data.messages;
  } catch (error) {
    throw error;
  }
}

export async function sendMessage(
  roomId: string,
  content: string,
  messageType: string = 'text',
  mediaUrl?: string,
) {
  try {
    const { data } = await api.post<ApiResponse<{ message: any }>>(
      `/chat/rooms/${roomId}/messages`,
      { content, messageType, mediaUrl },
    );
    return data.data.message;
  } catch (error) {
    throw error;
  }
}

export async function markAsRead(roomId: string) {
  try {
    await api.patch(`/chat/rooms/${roomId}/read`);
  } catch (error) {
    throw error;
  }
}

export async function sendHireRequest(workerId: string, message: string) {
  try {
    const { data } = await api.post<ApiResponse<{ chatRoom: any }>>(
      '/chat/hire-request',
      { workerId, message },
    );
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function respondToHireRequest(roomId: string, accept: boolean) {
  try {
    const { data } = await api.patch<ApiResponse<{ chatRoom: any }>>(
      `/chat/rooms/${roomId}/hire-response`,
      { accept },
    );
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteChatRoom(roomId: string) {
  try {
    await api.delete(`/chat/rooms/${roomId}`);
  } catch (error) {
    throw error;
  }
}

export async function startChat(targetUserId: string) {
  try {
    const { data } = await api.post<ApiResponse<{ chatRoom: any }>>('/chat/start', { targetUserId });
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteMessage(roomId: string, messageId: string) {
  try {
    await api.delete(`/chat/rooms/${roomId}/messages/${messageId}`);
  } catch (error) {
    throw error;
  }
}
