import api from '@/api/axios';

export type WorkerAvailability =
  | 'available'
  | 'busy'
  | 'offline';

export type Worker = {
  _id: string;
  name: string;
  email: string;
  phone: string;

  role: 'worker';

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

    ratingsReceived?: {
      rating: number;
      comment?: string;
      createdAt?: string;
    }[];

    availability?: WorkerAvailability;

    cnic?: string;
    cnicFront?: string;
    cnicBack?: string;

    verified?: boolean;

    bio?: string;

    hourlyRate?: number;
  };

  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;

  createdAt: string;
  updatedAt: string;
};

type WorkersResponse = {
  success: boolean;
  count: number;
  workers: Worker[];
};

type WorkerResponse = {
  success: boolean;
  message?: string;
  worker: Worker;
};

export async function getWorkers() {
  const { data } = await api.get<WorkersResponse>(
    '/adminWorker/workers'
  );

  return data.workers;
}

export async function getWorkerById(workerId: string) {
  const { data } = await api.get<WorkerResponse>(
    `/adminWorker/workers/${workerId}`
  );

  return data.worker;
}

export async function approveWorker(workerId: string) {
  const { data } = await api.post<WorkerResponse>(
    `/adminWorker/workers/${workerId}/approve`
  );

  return data.worker;
}

export async function deactivateWorker(workerId: string) {
  const { data } = await api.post<WorkerResponse>(
    `/adminWorker/workers/${workerId}/deactivate`
  );

  return data.worker;
}

export async function activateWorker(workerId: string) {
  const { data } = await api.post<WorkerResponse>(
    `/adminWorker/workers/${workerId}/activate`
  );

  return data.worker;
}
