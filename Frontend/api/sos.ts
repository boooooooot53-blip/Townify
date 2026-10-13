import api from "@/api/axios";
import type { ApiResponse } from "@/api/types";

export interface SOSFilters {
  status?: string;
  emergencyType?: string;
  page?: number;
  limit?: number;
}

export async function createSOS(payload: {
  emergencyType: string;
  description?: string;
  location: { address?: string; coordinates: number[] };
}) {
  try {
    const { data } = await api.post<ApiResponse<{ sos: any }>>("/sos", payload);
    return data.data.sos;
  } catch (error) {
    throw error;
  }
}

export async function getSOS(filters?: SOSFilters) {
  try {
    const { data } = await api.get<ApiResponse<{ alerts: any[] }>>("/sos", { params: filters });
    return data.data.alerts;
  } catch (error) {
    throw error;
  }
}

export async function respondToSOS(id: string) {
  try {
    const { data } = await api.patch<ApiResponse<{ sos: any }>>(`/sos/${id}/respond`);
    return data.data.sos;
  } catch (error) {
    throw error;
  }
}

export async function resolveSOS(id: string, resolutionNotes?: string) {
  try {
    const { data } = await api.patch<ApiResponse<{ sos: any }>>(`/sos/${id}/resolve`, {
      resolutionNotes,
    });
    return data.data.sos;
  } catch (error) {
    throw error;
  }
}

export async function cancelSOS(id: string) {
  try {
    const { data } = await api.patch<ApiResponse<{ sos: any }>>(`/sos/${id}/cancel`);
    return data.data.sos;
  } catch (error) {
    throw error;
  }
}
