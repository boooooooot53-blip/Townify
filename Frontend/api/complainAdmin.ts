import api from '@/api/axios';

export type ComplaintStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type Priority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type Complaint = {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  priority: Priority;
  images: string[];
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  location?: {
    address?: string;
    coordinates?: number[];
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  assignmentStatus?: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getComplaints() {
  const { data } = await api.get<{
    success: boolean;
    data: Complaint[];
  }>('/complains');

  return data.data;
}