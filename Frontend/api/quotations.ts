import api from "@/api/axios";
import type { ApiResponse } from "@/api/types";

export interface QuotationFilters {
  serviceRequestId?: string;
  status?: string;
  page?: number;
  limit?: number;
}


export async function getQuotations(filters?: QuotationFilters) {
  try {
    const { data } = await api.get<ApiResponse<{ quotations: any[] }>>("/quotations", {
      params: filters,
    });
    return data.data.quotations;
  } catch (error) {
    throw error;
  }
}


export async function getQuotationById(id: string) {
  try {
    const { data } = await api.get<ApiResponse<{ quotation: any }>>(`/quotations/${id}`);
    return data.data.quotation;
  } catch (error) {
    throw error;
  }
}

export async function createQuotation(payload: {
  serviceRequestId: string;
  amount: number;
  description: string;
  estimatedDuration?: { value: number; unit: "hours" | "days" };
  validUntil?: string;
}) {
  try {
    const { data } = await api.post<ApiResponse<{ quotation: any }>>("/quotations", payload);
    return data.data.quotation;
  } catch (error) {
    throw error;
  }
}

export async function acceptQuotation(id: string) {
  try {
    const { data } = await api.patch<
      ApiResponse<{ quotation: any; chatRoom: any }>
    >(`/quotations/${id}/accept`);
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function rejectQuotation(id: string) {
  try {
    const { data } = await api.patch<ApiResponse<{ quotation: any }>>(`/quotations/${id}/reject`);
    return data.data.quotation;
  } catch (error) {
    throw error;
  }
}

export async function deleteQuotation(id: string) {
  try {
    await api.delete(`/quotations/${id}`);
  } catch (error) {
    throw error;
  }
}