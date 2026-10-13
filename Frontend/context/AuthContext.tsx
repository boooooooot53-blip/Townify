import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as authApi from '@/api/auth';
import { setLogoutHandler } from '@/api/axios';
import type { ApiUser } from '@/api/types';
import { disconnectSocket, initSocket } from '@/utils/socket';
import { clearTokens, getAccessToken, saveTokens } from '@/utils/storage'; // FIX: import saveTokens
import { mapRoleToApi, mapUser, mapServiceTypeToApi } from '@/utils/mappers';

export type UserRole = 'user' | 'worker' | 'admin';

export interface User {
  id: string;//
  name: string;//
  email: string;//
  phone?: string;//
  avatar?: string;//
  role: UserRole;//
  location?: string;//
  rating?: number;//
  profession?: string;//
  bio?: string;//
  address?: ApiUser['address'];//1
  workerProfile?: ApiUser['workerProfile'];//
  categories?: string[];//
  approved?: boolean
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  profession?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toUser(apiUser: ApiUser): User {
  return mapUser(apiUser);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await authApi.getMe();
    setUser(toUser(me));
    // Socket already has the token from SecureStore — initSocket reads it
    await initSocket(token);
  }, []);

  useEffect(() => {
    setLogoutHandler(() => {
      setUser(null);
      disconnectSocket();
    });

    (async () => {
      try {
        await restoreSession();
      } catch {
        await clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email.trim(), password);
    setUser(toUser(result.user));

    await saveTokens(result.accessToken, result.refreshToken ?? '');

    await initSocket(result.accessToken);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    let apiProfessions: string | string[] | undefined = undefined;
    if (Array.isArray(data.profession)) {
      apiProfessions = data.profession.map(p => mapServiceTypeToApi(p));
    } else if (typeof data.profession === 'string') {
      apiProfessions = mapServiceTypeToApi(data.profession);
    }

    const result = await authApi.register(
      data.name.trim(),
      data.email.trim(),
      data.phone?.trim() || '+920000000000',
      data.password,
      mapRoleToApi(data.role),
      apiProfessions,
    );
    setUser(toUser(result.user));

    // FIX: Same as login — persist tokens so getAccessToken() works everywhere
    await saveTokens(result.accessToken, result.refreshToken ?? '');

    await initSocket(result.accessToken);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    await clearTokens(); // FIX: clear tokens on logout too
    disconnectSocket();
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isLoading, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
