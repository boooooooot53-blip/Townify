import api from '@/api/axios';

export type ComplaintStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type ComplaintPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type ComplaintUser = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string | null;
  address?: {
    street?: string;
    city?: string;
    area?: string;
  };
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
};

export type ComplaintWorker = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string | null;
  address?: {
    street?: string;
    city?: string;
    area?: string;
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
};

export type ComplaintLocation = {
  address?: string;
  area?: string;
  city?: string;
  coordinates?: number[];
};

export type Complaint = {
  _id: string;
  title: string;
  description: string;
  category: string;
  images?: string[];
  location?: ComplaintLocation;
  priority: ComplaintPriority;
  status: ComplaintStatus;

  user?: ComplaintUser | null;

  assignedTo?: ComplaintWorker | null;

  rejectionReason?: string;
  resolvedAt?: string | null;
  rejectedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

type ComplaintsResponse = {
  success: boolean;
  count: number;
  complaints: Complaint[];
};

type ComplaintResponse = {
  success: boolean;
  message?: string;
  complaint: Complaint;
};

type WorkersResponse = {
  success: boolean;
  count: number;
  workers: ComplaintWorker[];
};


/*
|--------------------------------------------------------------------------
| GET ALL COMPLAINTS
|--------------------------------------------------------------------------
*/
export async function getComplaints() {
  const { data } =
    await api.get<ComplaintsResponse>(
      'adminComplaints/complaints'
    );

  return data.complaints;
}


/*
|--------------------------------------------------------------------------
| GET SINGLE COMPLAINT
|--------------------------------------------------------------------------
*/
export async function getComplaintById(
  complaintId: string
) {
  const { data } =
    await api.get<ComplaintResponse>(
      `adminComplaints/complaints/${complaintId}`
    );

  return data.complaint;
}


/*
|--------------------------------------------------------------------------
| GET AVAILABLE WORKERS
|--------------------------------------------------------------------------
*/
export async function getWorkersForAssignment() {
  const { data } =
    await api.get<WorkersResponse>(
      'adminComplaints/complaints/workers/worker'
    );

  return data.workers;
}


/*
|--------------------------------------------------------------------------
| ASSIGN WORKER
|--------------------------------------------------------------------------
*/
export async function assignWorker(
  complaintId: string,
  workerId: string
) {
  const { data } =
    await api.post<ComplaintResponse>(
      `adminComplaints/complaints/${complaintId}/assign-worker`,
      {
        workerId,
      }
    );

  return data.complaint;
}


/*
|--------------------------------------------------------------------------
| CHANGE STATUS
|--------------------------------------------------------------------------
*/
export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus,
  rejectionReason?: string
) {
  const { data } =
    await api.post<ComplaintResponse>(
      `adminComplaints/complaints/${complaintId}/status`,
      {
        status,
        rejectionReason,
      }
    );

  return data.complaint;
}
