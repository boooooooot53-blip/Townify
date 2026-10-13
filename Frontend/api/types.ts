export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiRatingEntry {
  _id: string;
  userId: string;
  rating: number;
  review?: string;
  serviceRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "resident" | "worker" | "admin";
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
    ratingsReceived?: ApiRatingEntry[];
    availability?: "available" | "busy" | "offline";
    bio?: string;
    hourlyRate?: number;
    cnic?: string;
    cnicFront?: string;
    cnicBack?: string;
    verified?: boolean;
  };
  approved?: boolean;
  createdAt?: string;
  updatedAt?: string;
}