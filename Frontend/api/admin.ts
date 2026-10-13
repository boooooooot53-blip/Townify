import api from '@/api/axios';

export type AdminDashboard = {
  users: {
    total: number;
    residents: number;
    workers: number;
    admins: number;
    approved: number;
    pending: number;
    active: number;
    inactive: number;
  };

  complaints: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
    urgent: number;
  };

  complaintsByCategory: {
    category: string;
    count: number;
  }[];
};

export async function getDashboard() {
  const { data } = await api.get<{
    success: boolean;
    data: AdminDashboard;
  }>('/dashboard');

  return data.data;
}

