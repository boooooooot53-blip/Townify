import api from "@/api/axios";
import type { ApiResponse, ApiUser } from "@/api/types";

export interface WorkerFilters {
  skill?: string;
  availability?: string;
  page?: number;
  limit?: number;
}

export interface RateWorkerPayload {
  rating: number;           
  review?: string;          
  serviceRequestId?: string; 
}

export async function getWorkers(filters?: WorkerFilters) {
  try {
    const { data } = await api.get<ApiResponse<{ workers: ApiUser[] }>>("/users/workers", {
      params: filters,
    });
    return data.data.workers;
  } catch (error) {
    throw error;
  }
}

export async function getWorkerById(id: string) {
  try {
    const { data } = await api.get<ApiResponse<{ user: ApiUser }>>(`/users/${id}`);
    return data.data.user;
  } catch (error) {
    throw error;
  }
}

export async function updateWorkerProfile(payload: {
  skills?: string[];
  experience?: number;
  availability?: string;
  bio?: string;
  hourlyRate?: number;
  cnic?: string;
  cnicFront?: string;
  cnicBack?: string;
}) {
  try {
    const { data } = await api.put<ApiResponse<{ user: ApiUser }>>(
      "/users/worker-profile",
      payload
    );
    return data.data.user;
  } catch (error) {
    throw error;
  }
}

export async function rateWorker(workerId: string, payload: RateWorkerPayload) {
  try {
    const { data } = await api.post<ApiResponse<{ user: ApiUser }>>(
      `/users/${workerId}/rate`,
      payload
    );
    return data.data.user;
  } catch (error) {
    throw error;
  }
}