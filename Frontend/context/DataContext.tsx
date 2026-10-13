import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import * as chatApi from '@/api/chat';
import * as complaintsApi from '@/api/complaints';
import * as notificationsApi from '@/api/notifications';
import * as quotationsApi from '@/api/quotations';
import * as restaurantsApi from '@/api/restaurants';
import * as serviceRequestsApi from '@/api/serviceRequests';
import * as workersApi from '@/api/workers';
import { getErrorMessage } from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import {
  mapChatRoom,
  mapComplaint,
  mapMessage,
  mapNotification,
  mapQuotation,
  mapRestaurant,
  mapServiceRequest,
  mapWorker,
} from '@/utils/mappers';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  images?: string[];
  userId: string;
  location?: string;
  timeline: { status: string; note: string; date: string }[];
  assignmentStatus?: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  completionImages?: string[];
}

export interface Worker {
  id: string;
  name: string;
  profession: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  available: boolean;
  hourlyRate: number;
  experience: string;
  bio: string;
  completedJobs: number;
  avatar?: string;
  categories: string[];
  approved?: boolean;
}

export interface ServiceRequest {
  id: string;
  title?: string;
  category: string;
  description: string;
  status: 'pending' | 'quoted' | 'accepted' | 'assigned' | 'in_progress' | 'completed';
  createdAt: string;
  images?: string[];
  userId: string;
  userName?: string;
  userLocation?: string;
  userAvatar?: string;
  workerId?: string;
  assignedByAdmin?: boolean;
  quotations: Quotation[];
  completionImages?: string[];
}

export interface Quotation {
  id: string;
  workerId: string;
  workerName: string;
  workerRating: number;
  price: number;
  estimatedTime: string;
  note: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  accepted?: boolean;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
  hireStatus: 'pending' | 'accepted' | 'rejected' | null;
  blockedForUser: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  type:
    | 'text'
    | 'image'
    | 'hire_request'
    | 'hire_accepted'
    | 'hire_rejected'
    | 'system'
    | 'finalize_price'
    | 'price_accepted'
    | 'price_rejected';
  mediaUrl?: string;
  isDeleted?: boolean;
}

export interface Restaurant {
  id: string;
  ownerId: string | null;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  deliveryTime: string;
  minOrder: number;
  priceRange: string;
  isOpen: boolean;
  deals: Deal[];
  menu: MenuItem[];
  images?: string[];
  description?: string;
  contactPhone?: string;
  deliveryAvailable?: boolean;
  cuisines?: string[];
  location?: {
    address?: string;
    city?: string;
    area?: string;
  };
  openingHours?: Record<
    string,
    {
      open?: string;
      close?: string;
      isClosed?: boolean;
    }
  >;
}

export interface Deal {
  id: string;
  title: string;
  discount: string;
  validTill: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  popular?: boolean;
  image?: string;
  isVegetarian?: boolean;
  isAvailable?: boolean;
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra_hot';
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type:
    | 'complaint'
    | 'quotation'
    | 'chat'
    | 'sos'
    | 'general'
    | 'job'
    | 'hire_request'
    | 'hire_response'
    | 'rating';
  read: boolean;
  createdAt: string;
  data?: Record<string, string>;
  targetRole?: 'user' | 'worker' | 'all';
}

type ResourceState = { loading: boolean; error: string | null };

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────

interface DataContextType {
  complaints: Complaint[];
  workers: Worker[];
  users: any[];
  serviceRequests: ServiceRequest[];
  conversations: ChatConversation[];
  restaurants: Restaurant[];
  notifications: Notification[];
  complaintsState: ResourceState;
  workersState: ResourceState;
  usersState: ResourceState;
  serviceRequestsState: ResourceState;
  conversationsState: ResourceState;
  restaurantsState: ResourceState;
  notificationsState: ResourceState;

  fetchComplaints: (filters?: complaintsApi.ComplaintFilters) => Promise<void>;
  fetchWorkers: (filters?: workersApi.WorkerFilters) => Promise<void>;
  fetchUsers: (filters?: { role?: string; search?: string; page?: number }) => Promise<void>;
  fetchServiceRequests: (
    filters?: serviceRequestsApi.ServiceRequestFilters,
  ) => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchRestaurants: (
    filters?: restaurantsApi.RestaurantFilters,
  ) => Promise<void>;
  fetchNotifications: () => Promise<void>;

  fetchComplaintById: (id: string) => Promise<Complaint | null>;
  fetchServiceRequestWithQuotations: (
    id: string,
  ) => Promise<ServiceRequest | null>;
  fetchRestaurantById: (id: string) => Promise<Restaurant | null>;
  fetchWorkerById: (id: string) => Promise<Worker | null>;
  fetchMessages: (roomId: string) => Promise<ChatMessage[]>;

  createComplaint: (
    data: Parameters<typeof complaintsApi.createComplaint>[0],
  ) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
  updateComplaintStatus: (id: string, status: string, extra?: { assignedTo?: string; adminNotes?: string; assignmentStatus?: string; rejectionReason?: string }) => Promise<void>;
  createServiceRequest: (
    data: Parameters<typeof serviceRequestsApi.createServiceRequest>[0],
  ) => Promise<void>;
  deleteServiceRequest: (id: string) => Promise<void>;
  createQuotation: (
    data: Parameters<typeof quotationsApi.createQuotation>[0],
  ) => Promise<void>;
  acceptQuotation: (quotationId: string) => Promise<{ chatRoomId?: string }>;
  rejectQuotation: (quotationId: string) => Promise<void>;
  deleteQuotation: (quotationId: string) => Promise<void>;

  assignWorker: (id: string, workerId: string) => Promise<void>;
  updateAssignedStatus: (id: string, status: string, rejectionReason?: string, completionImages?: string[]) => Promise<void>;

  // Restaurant mutations
  createRestaurant: (
    payload: Parameters<typeof restaurantsApi.createRestaurant>[0],
  ) => Promise<Restaurant>;
  updateRestaurant: (
    id: string,
    payload: Parameters<typeof restaurantsApi.updateRestaurant>[1],
  ) => Promise<Restaurant>;
  deleteRestaurant: (id: string) => Promise<void>;

  // Menu-item mutations
  addMenuItem: (
    restaurantId: string,
    item: Parameters<typeof restaurantsApi.addMenuItem>[1],
  ) => Promise<void>;
  updateMenuItem: (
    restaurantId: string,
    itemId: string,
    item: Parameters<typeof restaurantsApi.updateMenuItem>[2],
  ) => Promise<void>;
  deleteMenuItem: (restaurantId: string, itemId: string) => Promise<void>;

  // Hire flow
  sendHireRequest: (
    workerId: string,
    message: string,
  ) => Promise<{ chatRoomId?: string }>;
  respondToHireRequest: (roomId: string, accept: boolean) => Promise<void>;
  updateConversationHireStatus: (
    roomId: string,
    status: 'pending' | 'accepted' | 'rejected',
  ) => void;
  startChat: (targetUserId: string) => Promise<ChatConversation>;
  deleteChatRoom: (roomId: string) => Promise<void>;
  deleteMessage: (roomId: string, messageId: string) => Promise<void>;

  // Rating
  rateWorker: (
    workerId: string,
    rating: number,
    review?: string,
    serviceRequestId?: string,
  ) => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
  unreadNotificationsCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context + Provider
// ─────────────────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextType | null>(null);
const emptyState: ResourceState = { loading: false, error: null };

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [complaintsState, setComplaintsState] = useState<ResourceState>({ loading: false, error: null });
  const [workersState, setWorkersState] = useState<ResourceState>({ loading: false, error: null });
  const [usersState, setUsersState] = useState<ResourceState>({ loading: false, error: null });
  const [serviceRequestsState, setServiceRequestsState] = useState<ResourceState>({ loading: false, error: null });
  const [conversationsState, setConversationsState] =
    useState<ResourceState>(emptyState);
  const [restaurantsState, setRestaurantsState] =
    useState<ResourceState>(emptyState);
  const [notificationsState, setNotificationsState] =
    useState<ResourceState>(emptyState);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchComplaints = useCallback(
    async (filters?: complaintsApi.ComplaintFilters) => {
      setComplaintsState({ loading: true, error: null });
      try {
        const data = await complaintsApi.getComplaints(filters);
        setComplaints(data.map(mapComplaint));
        setComplaintsState({ loading: false, error: null });
      } catch (error) {
        setComplaintsState({ loading: false, error: getErrorMessage(error) });
      }
    },
    [],
  );

  const fetchWorkers = useCallback(async (filters?: workersApi.WorkerFilters) => {
    setWorkersState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await workersApi.getWorkers(filters);
      setWorkers(data.map(mapWorker));
      setWorkersState((s) => ({ ...s, loading: false }));
    } catch (err: any) {
      setWorkersState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  const fetchUsers = useCallback(async (filters?: { role?: string; search?: string; page?: number }) => {
    setUsersState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { getAllUsers } = await import('@/api/users');
      const data = await getAllUsers(filters);
      setUsers(data);
      setUsersState((s) => ({ ...s, loading: false }));
    } catch (err: any) {
      setUsersState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  const fetchServiceRequests = useCallback(async (filters?: serviceRequestsApi.ServiceRequestFilters) => {
      setServiceRequestsState({ loading: true, error: null });
      try {
        const data = await serviceRequestsApi.getServiceRequests(filters);
        const mapped = await Promise.all(
          data.map(async (req) => {
            const quotes = await quotationsApi.getQuotations({
              serviceRequestId: req._id,
            });
            return mapServiceRequest(req, quotes.map(mapQuotation));
          }),
        );
        setServiceRequests(mapped);
        setServiceRequestsState({ loading: false, error: null });
      } catch (error) {
        setServiceRequestsState({
          loading: false,
          error: getErrorMessage(error),
        });
      }
    },
    [],
  );

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setConversationsState({ loading: true, error: null });
    try {
      const rooms = await chatApi.getChatRooms();
      setConversations(rooms.map((room) => mapChatRoom(room, user.id)));
      setConversationsState({ loading: false, error: null });
    } catch (error) {
      setConversationsState({ loading: false, error: getErrorMessage(error) });
    }
  }, [user]);

  const fetchRestaurants = useCallback(
    async (filters?: restaurantsApi.RestaurantFilters) => {
      setRestaurantsState({ loading: true, error: null });
      try {
        const data = await restaurantsApi.getRestaurants(filters);
        setRestaurants(data.map(mapRestaurant));
        setRestaurantsState({ loading: false, error: null });
      } catch (error) {
        setRestaurantsState({ loading: false, error: getErrorMessage(error) });
      }
    },
    [],
  );

  const fetchNotifications = useCallback(async () => {
    setNotificationsState({ loading: true, error: null });
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data.map(mapNotification));
      setNotificationsState({ loading: false, error: null });
    } catch (error) {
      setNotificationsState({ loading: false, error: getErrorMessage(error) });
    }
  }, []);

  // ── Fetch by ID ────────────────────────────────────────────────────────────

  const fetchComplaintById = useCallback(async (id: string) => {
    try {
      const complaint = await complaintsApi.getComplaintById(id);
      const mapped = mapComplaint(complaint);
      setComplaints((prev) => {
        const exists = prev.find((c) => c.id === mapped.id);
        return exists
          ? prev.map((c) => (c.id === mapped.id ? mapped : c))
          : [mapped, ...prev];
      });
      return mapped;
    } catch {
      return null;
    }
  }, []);

  const fetchServiceRequestWithQuotations = useCallback(async (id: string) => {
    try {
      const request = await serviceRequestsApi.getServiceRequestById(id);
      const quotes = await quotationsApi.getQuotations({
        serviceRequestId: id,
      });
      const mapped = mapServiceRequest(request, quotes.map(mapQuotation));
      setServiceRequests((prev) => {
        const exists = prev.find((r) => r.id === mapped.id);
        return exists
          ? prev.map((r) => (r.id === mapped.id ? mapped : r))
          : [mapped, ...prev];
      });
      return mapped;
    } catch {
      return null;
    }
  }, []);

  const fetchRestaurantById = useCallback(async (id: string) => {
    try {
      const restaurant = await restaurantsApi.getRestaurantById(id);
      const mapped = mapRestaurant(restaurant);
      setRestaurants((prev) => {
        const exists = prev.find((r) => r.id === mapped.id);
        return exists
          ? prev.map((r) => (r.id === mapped.id ? mapped : r))
          : [mapped, ...prev];
      });
      return mapped;
    } catch {
      return null;
    }
  }, []);

  const fetchWorkerById = useCallback(async (id: string) => {
    try {
      const worker = await workersApi.getWorkerById(id);
      const mapped = mapWorker(worker);
      setWorkers((prev) => {
        const exists = prev.find((w) => w.id === mapped.id);
        return exists
          ? prev.map((w) => (w.id === mapped.id ? mapped : w))
          : [mapped, ...prev];
      });
      return mapped;
    } catch {
      return null;
    }
  }, []);

  const fetchMessages = useCallback(
    async (roomId: string) => {
      if (!user) return [];
      const messages = await chatApi.getMessages(roomId);
      const mapped = messages.map((m) => mapMessage(m, user.id));
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === roomId
            ? { ...conv, messages: mapped, unreadCount: 0 }
            : conv,
        ),
      );
      return mapped;
    },
    [user],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createComplaint = useCallback(
    async (data: Parameters<typeof complaintsApi.createComplaint>[0]) => {
      await complaintsApi.createComplaint(data);
      await fetchComplaints();
      await fetchNotifications();
    },
    [fetchComplaints, fetchNotifications],
  );

  const deleteComplaint = useCallback(async (id: string) => {
    await complaintsApi.deleteComplaint(id);
    setComplaints((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateComplaintStatus = useCallback(
    async (id: string, status: string, extra?: { assignedTo?: string; adminNotes?: string }) => {
      await complaintsApi.updateComplaintStatus(id, status, extra);
      await fetchComplaints();
      await fetchNotifications();
    },
    [fetchComplaints, fetchNotifications]
  );

  const createServiceRequest = useCallback(
    async (
      data: Parameters<typeof serviceRequestsApi.createServiceRequest>[0],
    ) => {
      await serviceRequestsApi.createServiceRequest(data);
      await fetchServiceRequests();
    },
    [fetchServiceRequests],
  );

  const deleteServiceRequest = useCallback(async (id: string) => {
    await serviceRequestsApi.deleteServiceRequest(id);
    setServiceRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const createQuotation = useCallback(
    async (data: Parameters<typeof quotationsApi.createQuotation>[0]) => {
      await quotationsApi.createQuotation(data);
      await fetchServiceRequests();
    },
    [fetchServiceRequests],
  );

  const acceptQuotation = useCallback(
    async (quotationId: string) => {
      const result = await quotationsApi.acceptQuotation(quotationId);
      await fetchServiceRequests();
      await fetchConversations();
      await fetchNotifications();
      return { chatRoomId: result.chatRoom?._id as string | undefined };
    },
    [fetchServiceRequests, fetchConversations, fetchNotifications],
  );

  const rejectQuotation = useCallback(
    async (quotationId: string) => {
      await quotationsApi.rejectQuotation(quotationId);
      await fetchServiceRequests();
      await fetchNotifications();
    },
    [fetchServiceRequests, fetchNotifications],
  );

  const deleteQuotation = useCallback(
    async (quotationId: string) => {
      await quotationsApi.deleteQuotation(quotationId);
      await fetchServiceRequests();
    },
    [fetchServiceRequests],
  );

  const assignWorker = useCallback(
    async (id: string, workerId: string) => {
      await serviceRequestsApi.assignWorker(id, workerId);
      await fetchServiceRequests();
      await fetchNotifications();
    },
    [fetchServiceRequests, fetchNotifications],
  );

  const updateAssignedStatus = useCallback(
    async (id: string, status: string, rejectionReason?: string, completionImages?: string[]) => {
      await serviceRequestsApi.updateAssignedStatus(id, status, rejectionReason, completionImages);
      await fetchServiceRequests();
    },
    [fetchServiceRequests],
  );

  // ── Restaurant mutations ───────────────────────────────────────────────────

  const createRestaurant = useCallback(
    async (payload: Parameters<typeof restaurantsApi.createRestaurant>[0]) => {
      const raw = await restaurantsApi.createRestaurant(payload);
      const mapped = mapRestaurant(raw);
      setRestaurants((prev) => [mapped, ...prev]);
      return mapped;
    },
    [],
  );

  const updateRestaurant = useCallback(
    async (
      id: string,
      payload: Parameters<typeof restaurantsApi.updateRestaurant>[1],
    ) => {
      const raw = await restaurantsApi.updateRestaurant(id, payload);
      const mapped = mapRestaurant(raw);
      setRestaurants((prev) => prev.map((r) => (r.id === id ? mapped : r)));
      return mapped;
    },
    [],
  );

  const deleteRestaurant = useCallback(async (id: string) => {
    await restaurantsApi.deleteRestaurant(id);
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ── Menu-item mutations ────────────────────────────────────────────────────

  const addMenuItem = useCallback(
    async (
      restaurantId: string,
      item: Parameters<typeof restaurantsApi.addMenuItem>[1],
    ) => {
      await restaurantsApi.addMenuItem(restaurantId, item);
      // Refetch so the new item gets its server-assigned _id
      await fetchRestaurantById(restaurantId);
    },
    [fetchRestaurantById],
  );

  const updateMenuItem = useCallback(
    async (
      restaurantId: string,
      itemId: string,
      item: Parameters<typeof restaurantsApi.updateMenuItem>[2],
    ) => {
      const raw = await restaurantsApi.updateMenuItem(
        restaurantId,
        itemId,
        item,
      );
      const mappedItem: MenuItem = {
        id: raw._id,
        name: raw.name,
        description: raw.description ?? '',
        price: raw.price,
        category: raw.category,
        popular: raw.category === 'special',
        image: raw.image,
        isVegetarian: raw.isVegetarian,
        isAvailable: raw.isAvailable,
        spiceLevel: raw.spiceLevel,
      };
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === restaurantId
            ? {
                ...r,
                menu: r.menu.map((m) => (m.id === itemId ? mappedItem : m)),
              }
            : r,
        ),
      );
    },
    [],
  );

  const deleteMenuItem = useCallback(
    async (restaurantId: string, itemId: string) => {
      await restaurantsApi.deleteMenuItem(restaurantId, itemId);
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === restaurantId
            ? { ...r, menu: r.menu.filter((m) => m.id !== itemId) }
            : r,
        ),
      );
    },
    [],
  );

  // ── Hire flow ──────────────────────────────────────────────────────────────

  const sendHireRequest = useCallback(
    async (workerId: string, message: string) => {
      const result = await chatApi.sendHireRequest(workerId, message);
      await fetchConversations();
      await fetchNotifications();
      return { chatRoomId: result.chatRoom?._id as string | undefined };
    },
    [fetchConversations, fetchNotifications],
  );

  const respondToHireRequest = useCallback(
    async (roomId: string, accept: boolean) => {
      await chatApi.respondToHireRequest(roomId, accept);
      await fetchConversations();
      await fetchNotifications();
    },
    [fetchConversations, fetchNotifications],
  );

  const startChat = useCallback(
    async (targetUserId: string) => {
      if (!user) throw new Error('Not authenticated');
      const data = await chatApi.startChat(targetUserId);
      const mapped = mapChatRoom(data.chatRoom, user.id);
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === mapped.id);
        if (exists) return prev;
        return [mapped, ...prev];
      });
      return mapped;
    },
    [user],
  );

  const updateConversationHireStatus = useCallback(
    (roomId: string, status: 'pending' | 'accepted' | 'rejected') => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === roomId
            ? {
                ...c,
                hireStatus: status,
                blockedForUser: status === 'rejected',
              }
            : c,
        ),
      );
    },
    [],
  );

  // ── Rating ─────────────────────────────────────────────────────────────────

  const rateWorker = useCallback(
    async (
      workerId: string,
      rating: number,
      review?: string,
      serviceRequestId?: string,
    ) => {
      await workersApi.rateWorker(workerId, {
        rating,
        review,
        serviceRequestId,
      });
      await fetchWorkerById(workerId);
    },
    [fetchWorkerById],
  );

  // ── Notifications ──────────────────────────────────────────────────────────

  const markNotificationRead = useCallback(async (id: string) => {
    await notificationsApi.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => notificationsApi.markNotificationRead(n.id)),
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const deleteNotification = useCallback(async (id: string) => {
    await notificationsApi.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);


  const deleteChatRoom = useCallback(
    async (roomId: string) => {
      await chatApi.deleteChatRoom(roomId);
      setConversations((prev) => prev.filter((c) => c.id !== roomId));
    },
    [],
  );

  const deleteMessage = useCallback(
    async (roomId: string, messageId: string) => {
      await chatApi.deleteMessage(roomId, messageId);
      
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== roomId) return c;
          const updatedMessages = c.messages.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, text: 'This message was deleted', type: 'text' as const, mediaUrl: undefined }
              : m
          );
          
          let newLastMessage = c.lastMessage;
          if (c.messages.length > 0 && c.messages[0].id === messageId) {
            newLastMessage = 'This message was deleted';
          }
          
          return {
            ...c,
            messages: updatedMessages,
            lastMessage: newLastMessage,
          };
        }),
      );

      // Force a backend sync so the chat list accurately reflects changes instantly
      await fetchConversations();
    },
    [fetchConversations],
  );

  // ── Context value ──────────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      complaints,
      workers,
      users,
      serviceRequests,
      conversations,
      restaurants,
      notifications,
      complaintsState,
      workersState,
      usersState,
      serviceRequestsState,
      conversationsState,
      restaurantsState,
      notificationsState,
      fetchComplaints,
      fetchWorkers,
      fetchUsers,
      fetchServiceRequests,
      fetchConversations,
      fetchRestaurants,
      fetchNotifications,
      fetchComplaintById,
      fetchServiceRequestWithQuotations,
      fetchRestaurantById,
      fetchWorkerById,
      fetchMessages,
      createComplaint,
      deleteComplaint,
      updateComplaintStatus,
      createServiceRequest,
      deleteServiceRequest,
      createQuotation,
      acceptQuotation,
      rejectQuotation,
      deleteQuotation,
      assignWorker,
      updateAssignedStatus,
      createRestaurant,
      updateRestaurant,
      deleteRestaurant,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      sendHireRequest,
      respondToHireRequest,
      updateConversationHireStatus,
      rateWorker,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      deleteComplaint,
      unreadNotificationsCount,
      deleteChatRoom,
      startChat,
      deleteMessage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      complaints,
      workers,
      serviceRequests,
      conversations,
      restaurants,
      notifications,
      complaintsState,
      workersState,
      serviceRequestsState,
      conversationsState,
      restaurantsState,
      notificationsState,
      fetchComplaints,
      fetchWorkers,
      fetchServiceRequests,
      fetchConversations,
      fetchRestaurants,
      fetchNotifications,
      fetchComplaintById,
      fetchServiceRequestWithQuotations,
      fetchRestaurantById,
      fetchWorkerById,
      fetchMessages,
      createComplaint,
      createServiceRequest,
      deleteServiceRequest,
      createQuotation,
      acceptQuotation,
      rejectQuotation,
      deleteQuotation,
      assignWorker,
      updateAssignedStatus,
      createRestaurant,
      updateRestaurant,
      deleteRestaurant,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      sendHireRequest,
      respondToHireRequest,
      updateConversationHireStatus,
      rateWorker,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      deleteComplaint,
      unreadNotificationsCount,
      deleteChatRoom,
      startChat,
      deleteMessage,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
