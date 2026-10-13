import api from '@/api/axios';
import type { ApiResponse } from '@/api/types';

export interface RestaurantFilters {
  cuisine?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getRestaurants(filters?: RestaurantFilters) {
  try {
    const { data } = await api.get<ApiResponse<{ restaurants: any[] }>>(
      '/restaurants',
      {
        params: filters,
      },
    );
    return data.data.restaurants;
  } catch (error) {
    throw error;
  }
}

export async function getRestaurantById(id: string) {
  try {
    const { data } = await api.get<ApiResponse<{ restaurant: any }>>(
      `/restaurants/${id}`,
    );
    return data.data.restaurant;
  } catch (error) {
    throw error;
  }
}

export async function createRestaurant(payload: Record<string, unknown>) {
  try {
    const { data } = await api.post<ApiResponse<{ restaurant: any }>>(
      '/restaurants',
      payload,
    );
    return data.data.restaurant;
  } catch (error) {
    throw error;
  }
}

export async function updateRestaurant(
  id: string,
  payload: Record<string, unknown>,
) {
  try {
    const { data } = await api.put<ApiResponse<{ restaurant: any }>>(
      `/restaurants/${id}`,
      payload,
    );
    return data.data.restaurant;
  } catch (error) {
    throw error;
  }
}

export async function deleteRestaurant(id: string) {
  try {
    await api.delete(`/restaurants/${id}`);
  } catch (error) {
    throw error;
  }
}

export async function addMenuItem(
  restaurantId: string,
  item: Record<string, unknown>,
) {
  try {
    const { data } = await api.post<ApiResponse<{ menuItem: any }>>(
      `/restaurants/${restaurantId}/menu`,
      item,
    );
    return data.data.menuItem;
  } catch (error) {
    throw error;
  }
}

export async function updateMenuItem(
  restaurantId: string,
  itemId: string,
  item: Record<string, unknown>,
) {
  try {
    const { data } = await api.put<ApiResponse<{ menuItem: any }>>(
      `/restaurants/${restaurantId}/menu/${itemId}`,
      item,
    );
    return data.data.menuItem;
  } catch (error) {
    throw error;
  }
}

export async function deleteMenuItem(restaurantId: string, itemId: string) {
  try {
    await api.delete(`/restaurants/${restaurantId}/menu/${itemId}`);
  } catch (error) {
    throw error;
  }
}
