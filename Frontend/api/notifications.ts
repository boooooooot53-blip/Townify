import api from "@/api/axios";
import type { ApiResponse } from "@/api/types";

export async function getNotifications(unreadOnly = false) {
  try {
    const { data } = await api.get<ApiResponse<{ notifications: any[] }>>("/notifications", {
      params: { unreadOnly },
    });
    return data.data.notifications;
  } catch (error) {
    throw error;
  }
}


export async function markNotificationRead(id: string) {
  try {
    const { data } = await api.put<ApiResponse<{ notification: any }>>(
      `/notifications/${id}/read`
    );
    return data.data.notification;
  } catch (error) {
    throw error;
  }
}

export async function markAllNotificationsRead() {
  try {
    await api.put("/notifications/read-all");
  } catch (error) {
    throw error;
  }
}

export async function deleteNotification(id: string) {
  try {
    await api.delete(`/notifications/${id}`);
  } catch (error) {
    throw error;
  }
}