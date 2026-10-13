import api from '@/api/axios';
import type { ApiResponse } from '@/api/types';
import { mapServiceTypeToApi } from '@/utils/mappers';

export interface ServiceRequestFilters {
  status?: string;
  serviceType?: string;
  page?: number;
  limit?: number;
}

export async function getServiceRequests(filters?: ServiceRequestFilters) {
  try {
    const params: Record<string, string | number> = { ...filters };
    if (filters?.serviceType) {
      params.serviceType = mapServiceTypeToApi(filters.serviceType);
    }
    const { data } = await api.get<ApiResponse<{ serviceRequests: any[] }>>(
      '/service-requests',
      {
        params,
      },
    );
    return data.data.serviceRequests;
  } catch (error) {
    throw error;
  }
}

export async function getServiceRequestById(id: string) {
  try {
    const { data } = await api.get<ApiResponse<{ serviceRequest: any }>>(
      `/service-requests/${id}`,
    );
    return data.data.serviceRequest;
  } catch (error) {
    throw error;
  }
}

export async function createServiceRequest(payload: {
  title: string;
  description: string;
  serviceType: string;
  preferredDate?: string;
  location?: { address?: string; coordinates?: number[] };
  images?: string[];
}) {
  try {
    const { data } = await api.post<ApiResponse<{ serviceRequest: any }>>(
      '/service-requests',
      {
        ...payload,
        serviceType: mapServiceTypeToApi(payload.serviceType),
      },
    );
    return data.data.serviceRequest;
  } catch (error) {
    throw error;
  }
}

export async function updateServiceRequest(
  id: string,
  payload: Record<string, unknown>,
) {
  try {
    const { data } = await api.put<ApiResponse<{ serviceRequest: any }>>(
      `/service-requests/${id}`,
      payload,
    );
    return data.data.serviceRequest;
  } catch (error) {
    throw error;
  }
}

export async function deleteServiceRequest(id: string) {
  try {
    await api.delete(`/service-requests/${id}`);
  } catch (error) {
    throw error;
  }
}

export async function assignWorker(id: string, workerId: string) {
  try {
    const { data } = await api.post<ApiResponse<{ serviceRequest: any }>>(
      `/service-requests/${id}/assign`,
      { workerId }
    );
    return data.data.serviceRequest;
  } catch (error) {
    throw error;
  }
}

export async function updateAssignedStatus(id: string, status: string, rejectionReason?: string, completionImages?: string[]) {
  try {
    const { data } = await api.patch<ApiResponse<{ serviceRequest: any }>>(
      `/service-requests/${id}/assigned-status`,
      { status, rejectionReason, completionImages }
    );
    return data.data.serviceRequest;
  } catch (error) {
    throw error;
  }
}
