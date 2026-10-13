import api from "@/api/axios";
import type { ApiResponse } from "@/api/types";
import { mapComplaintCategoryToApi } from "@/utils/mappers";

export interface ComplaintFilters {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function getComplaints(filters?: ComplaintFilters) {
  try {
    const params: Record<string, string | number> = { ...filters };
    if (filters?.category) {
      params.category = mapComplaintCategoryToApi(filters.category);
    }
    const { data } = await api.get<ApiResponse<{ complaints: any[] }>>("/complaints", { params });
    return data.data.complaints;
  } catch (error) {
    throw error;
  }
}

export async function getComplaintById(id: string) {
  try {
    const { data } = await api.get<ApiResponse<{ complaint: any }>>(`/complaints/${id}`);
    return data.data.complaint;
  } catch (error) {
    throw error;
  }
}

export async function createComplaint(payload: {
  title: string;
  description: string;
  category: string;
  priority?: string;
  images?: string[];
  location?: { address?: string; coordinates?: number[] };
}) {
  try {
    const { data } = await api.post<ApiResponse<{ complaint: any }>>("/complaints", {
      ...payload,
      category: mapComplaintCategoryToApi(payload.category),
    });
    return data.data.complaint;
  } catch (error) {
    throw error;
  }
}

export async function updateComplaint(id: string, payload: Record<string, unknown>) {
  try {
    const { data } = await api.put<ApiResponse<{ complaint: any }>>(`/complaints/${id}`, payload);
    return data.data.complaint;
  } catch (error) {
    throw error;
  }
}

export async function deleteComplaint(id: string) {
  try {
    await api.delete(`/complaints/${id}`);
  } catch (error) {
    throw error;
  }
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  extra?: { assignedTo?: string; adminNotes?: string; assignmentStatus?: string; rejectionReason?: string }
) {
  try {
    const { data } = await api.patch<ApiResponse<{ complaint: any }>>(`/complaints/${id}/status`, {
      status,
      ...extra,
    });
    return data.data.complaint;
  } catch (error) {
    throw error;
  }
}
