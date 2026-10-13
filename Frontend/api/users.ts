import api from "@/api/axios";
import type { ApiResponse, ApiUser } from "@/api/types";

export async function getUserById(id: string) {
  try {
    const { data } = await api.get<ApiResponse<{ user: ApiUser }>>(`/users/${id}`);
    return data.data.user;
  } catch (error) {
    throw error;
  }
}

export async function updateUser(
  id: string,
  payload: {
    name?: string;
    phone?: string;
    address?: ApiUser["address"];
    profileImage?: string | null;
    fcmToken?: string | null;
  }
) {
  try {
    const { data } = await api.put<ApiResponse<{ user: ApiUser }>>(`/users/${id}`, payload);
    return data.data.user;
  } catch (error) {
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    const { data } = await api.delete<ApiResponse<null>>(`/users/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getAllUsers(filters?: { role?: string; search?: string; page?: number }) {
  try {
    const { data } = await api.get<ApiResponse<{ users: ApiUser[] }>>("/users", { params: filters });
    return data.data.users;
  } catch (error) {
    throw error;
  }
}
