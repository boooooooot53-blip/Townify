import api from '@/api/axios';

export type UserRole = 'resident' | 'worker' | 'admin';

export type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  approved: boolean;
  isActive: boolean;
  profileImage?: string | null;
  address?: {
    street?: string;
    city?: string;
    area?: string;
    coordinates?: number[];
  };
  workerProfile?: {
    skills?: string[];
    experience?: number;
    rating?: number;
    totalReviews?: number;
    completedJobs?: number;
    availability?: 'available' | 'busy' | 'offline';
    verified?: boolean;
    bio?: string;
    hourlyRate?: number;
  };
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  success: boolean;
  count: number;
  users: User[];
};

type UserResponse = {
  success: boolean;
  message: string;
  user: User;
};

/**
 * Get all users for admin management
 */
export async function getUsers() {
  const { data } = await api.get<UsersResponse>(
    '/admin/users',
  );

  return data.users;
}

/**
 * Approve a pending user
 */
export async function approveUser(userId: string) {
  const { data } = await api.post<UserResponse>(
    `/admin/users/${userId}/approve`,
  );

  return data.user;
}

/**
 * Deactivate an approved user
 */
export async function deactivateUser(userId: string) {
  const { data } = await api.post<UserResponse>(
    `/admin/users/${userId}/deactivate`,
  );

  return data.user;
}

/**
 * Activate an inactive user
 */
export async function activateUser(userId: string) {
  const { data } = await api.post<UserResponse>(
    `/admin/users/${userId}/activate`,
  );

  return data.user;
}