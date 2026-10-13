import type { ApiUser } from '@/api/types';
import type {
  ChatConversation,
  ChatMessage,
  Complaint,
  Notification,
  Quotation,
  Restaurant,
  ServiceRequest,
  Worker,
} from '@/context/DataContext';

export type UiRole = 'user' | 'worker' | 'admin';

export function mapRole(role: ApiUser['role']): UiRole {
  if (role === 'resident') return 'user';
  return role;
}

export function mapRoleToApi(role: UiRole): 'resident' | 'worker' | 'admin' {
  if (role === 'user') return 'resident';
  return role;
}

export function mapUser(user: ApiUser) {
  const locationParts = [
    user.address?.area,
    user.address?.city,
    user.address?.street,
  ].filter(Boolean);
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.profileImage ?? undefined,
    role: mapRole(user.role),
    location: locationParts.join(', ') || undefined,
    rating: user.workerProfile?.rating,
    profession: user.workerProfile?.skills?.[0],
    bio: user.workerProfile?.bio,
    address: user.address,
    workerProfile: user.workerProfile,
    categories: (user.workerProfile?.skills ?? []).map(mapServiceTypeToUi),
  };
}

const SERVICE_TYPE_MAP: Record<string, string> = {
  electrical: 'electrical',
  plumbing: 'plumbing',
  carpentry: 'carpentry',
  painting: 'painting',
  cleaning: 'cleaning',
  gardening: 'gardening',
  appliance_repair: 'ac_repair',
  moving: 'moving',
  pest_control: 'pest_control',
  other: 'other',
};

const REVERSE_SERVICE_TYPE_MAP: Record<string, string> = {
  electrical: 'electrical',
  plumbing: 'plumbing',
  carpentry: 'carpentry',
  painting: 'painting',
  ac_repair: 'appliance_repair',
  pest_control: 'pest_control',
  cleaning: 'cleaning',
  gardening: 'gardening',
  moving: 'moving',
  other: 'other',
};

export function mapServiceTypeToUi(serviceType: string): string {
  return SERVICE_TYPE_MAP[serviceType] ?? serviceType;
}

export function mapServiceTypeToApi(category: string): string {
  return REVERSE_SERVICE_TYPE_MAP[category] ?? category;
}

const COMPLAINT_CATEGORY_MAP: Record<string, string> = {
  infrastructure: 'Infrastructure',
  sanitation: 'Sanitation',
  security: 'Security',
  noise: 'Noise',
  utilities: 'Utilities',
  traffic: 'Traffic',
  other: 'Other',
};

const REVERSE_COMPLAINT_CATEGORY_MAP: Record<string, string> = {
  Infrastructure: 'infrastructure',
  Utilities: 'utilities',
  Sanitation: 'sanitation',
  Security: 'security',
  Parks: 'other',
  Other: 'other',
  Noise: 'noise',
  Traffic: 'traffic',
};

export function mapComplaintCategoryToUi(category: string): string {
  return COMPLAINT_CATEGORY_MAP[category] ?? category;
}

export function mapComplaintCategoryToApi(category: string): string {
  return REVERSE_COMPLAINT_CATEGORY_MAP[category] ?? category.toLowerCase();
}

export function buildComplaintTimeline(complaint: any): Complaint['timeline'] {
  const timeline: Complaint['timeline'] = [
    {
      status: 'pending',
      note: 'Complaint submitted',
      date: complaint.createdAt,
    },
  ];
  if (complaint.status !== 'pending') {
    timeline.push({
      status: complaint.status,
      note:
        complaint.adminNotes ||
        `Status updated to ${complaint.status.replace('_', ' ')}`,
      date: complaint.updatedAt ?? complaint.createdAt,
    });
  }
  if (complaint.resolvedAt) {
    timeline.push({
      status: 'resolved',
      note: complaint.adminNotes || 'Complaint resolved',
      date: complaint.resolvedAt,
    });
  }
  return timeline;
}

export function mapComplaint(complaint: any): Complaint {
  return {
    id: complaint._id,
    title: complaint.title,
    description: complaint.description,
    category: mapComplaintCategoryToUi(complaint.category),
    status: complaint.status,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt ?? complaint.createdAt,
    images: complaint.images ?? [],
    userId:
      typeof complaint.user === 'object' ? complaint.user._id : complaint.user,
    location: complaint.location?.address,
    timeline: buildComplaintTimeline(complaint),
    assignmentStatus: complaint.assignmentStatus,
    rejectionReason: complaint.rejectionReason,
    completionImages: complaint.completionImages ?? [],
  };
}

export function mapWorker(user: ApiUser): Worker {
  const primarySkill = user.workerProfile?.skills?.[0] ?? 'general';
  return {
    id: user._id,
    name: user.name,
    profession: primarySkill.replace(/_/g, ' '),
    category: mapServiceTypeToUi(primarySkill),
    rating: user.workerProfile?.rating ?? 0,
    reviews: user.workerProfile?.totalReviews ?? 0,
    location:
      [user.address?.area, user.address?.city].filter(Boolean).join(', ') ||
      'Lahore',
    available: user.workerProfile?.availability === 'available',
    hourlyRate: user.workerProfile?.hourlyRate ?? 0,
    experience: `${user.workerProfile?.experience ?? 0} years`,
    bio: user.workerProfile?.bio ?? '',
    completedJobs: user.workerProfile?.totalReviews ?? 0,
    avatar: user.profileImage ?? undefined,
    categories: (user.workerProfile?.skills ?? []).map(mapServiceTypeToUi),
    approved: user.approved,
  };
}

export function mapQuotation(q: any): Quotation {
  return {
    id: q._id,
    workerId: q.worker?._id ?? q.worker,
    workerName: q.worker?.name ?? 'Unknown',
    workerRating: q.worker?.workerProfile?.rating ?? 0,
    price: q.amount,
    estimatedTime: q.estimatedDuration
      ? `${q.estimatedDuration.value} ${q.estimatedDuration.unit}`
      : 'TBD',
    note: q.description ?? '',
    createdAt: q.createdAt,
    status: q.status ?? 'pending',
    accepted: q.status === 'accepted',
  };
}

export function mapServiceRequest(
  request: any,
  quotations: Quotation[] = [],
): ServiceRequest {
  const user = request.user;
  return {
    id: request._id,
    title: request.title,
    category: mapServiceTypeToUi(request.serviceType),
    description: request.description,
    status:
      request.status === 'open'
        ? 'pending'
        : request.status === 'cancelled'
          ? 'completed'
          : request.status,
    createdAt: request.createdAt,
    images: request.images ?? [],
    userId: typeof user === 'object' ? user._id : user,
    userName: typeof user === 'object' ? user.name : undefined,
    userAvatar:
      typeof user === 'object' ? (user.profileImage ?? undefined) : undefined,
    userLocation: request.location?.address,
    workerId: request.assignedWorker
      ? typeof request.assignedWorker === 'object'
        ? request.assignedWorker._id
        : request.assignedWorker
      : undefined,
    assignedByAdmin: !!request.assignedByAdmin,
    quotations,
    completionImages: request.completionImages ?? [],
  };
}

export function mapChatRoom(
  room: any,
  currentUserId: string,
): ChatConversation {
  const other = (room.participants ?? []).find(
    (p: any) => (typeof p === 'object' ? p._id : p) !== currentUserId,
  );
  const participant = typeof other === 'object' ? other : null;

  return {
    id: room._id,
    participantId: participant?._id ?? '',
    participantName: participant?.name ?? 'User',
    participantAvatar: participant?.profileImage ?? undefined,
    participantRole: participant?.role === 'worker' ? 'Worker' : 'Resident',
    lastMessage: room.lastMessage ?? '',
    lastMessageTime: room.lastMessageAt ?? room.updatedAt ?? room.createdAt,
    unreadCount: 0,
    messages: [],
    hireStatus: room.hireStatus ?? null,
    blockedForUser: room.blockedForUser ?? false,
  };
}

export function mapMessage(message: any, currentUserId: string): ChatMessage {
  const senderId =
    typeof message.sender === 'object' ? message.sender._id : message.sender;
  const readByMe = (message.readBy ?? []).some(
    (r: any) =>
      (typeof r.user === 'object' ? r.user._id : r.user) === currentUserId,
  );

  const rawType = message.messageType ?? message.type ?? 'text';

  const validTypes = [
    'text',
    'image',
    'hire_request',
    'hire_accepted',
    'hire_rejected',
    'system',
    'finalize_price',
    'price_accepted',
    'price_rejected',
  ];
  type MsgType = 'text' | 'image' | 'hire_request' | 'hire_accepted' | 'hire_rejected' | 'system' | 'finalize_price' | 'price_accepted' | 'price_rejected';
  
  const type: MsgType = validTypes.includes(rawType as string)
    ? (rawType as MsgType)
    : 'text';

  return {
    id: message._id,
    senderId,
    text: message.content,
    timestamp: message.createdAt,
    read: readByMe || senderId === currentUserId,
    type,
    mediaUrl: message.mediaUrl,
    isDeleted: !!message.isDeleted,
  };
}

export function mapNotification(notification: any): Notification {
  return {
    id: notification._id,
    title: notification.title,
    body: notification.message,
    type: notification.type,
    read: notification.isRead,
    createdAt: notification.createdAt,
    data: notification.data ?? undefined,
  };
}

export function mapRestaurant(restaurant: any): Restaurant {
  const cuisine = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine.join(', ')
    : 'Restaurant';
  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();
  const hours = restaurant.openingHours?.[today];
  const isOpen = hours ? !hours.isClosed : true;

  return {
    id: restaurant._id,
    ownerId:
      typeof restaurant.owner === 'object'
        ? restaurant.owner._id
        : (restaurant.owner ?? null),
    name: restaurant.name,
    category: cuisine,
    rating: restaurant.rating?.average ?? 0,
    reviews: restaurant.rating?.count ?? 0,
    distance:
      restaurant.location?.area ?? restaurant.location?.city ?? 'Nearby',
    deliveryTime: restaurant.deliveryAvailable ? '30-45 min' : 'Pickup only',
    minOrder: restaurant.minimumOrder ?? 0,
    priceRange: '$$',
    isOpen,
    deals: [],
    menu: (restaurant.menuItems ?? []).map((item: any) => ({
      id: item._id,
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      category: item.category,
      popular: item.category === 'special',
      image: item.image,
      isVegetarian: item.isVegetarian ?? false, // ← ADD
      isAvailable: item.isAvailable ?? true, // ← ADD
      spiceLevel: item.spiceLevel ?? 'mild', // ← ADD
    })),
    images: restaurant.images ?? [],
    description: restaurant.description,
    contactPhone: restaurant.contactPhone,
    deliveryAvailable: restaurant.deliveryAvailable,
    cuisines: restaurant.cuisine ?? [], // ← ADD (backend "cuisine" → frontend "cuisines")
    location: restaurant.location, // ← ADD
    openingHours: restaurant.openingHours, // ← ADD
  };
}
