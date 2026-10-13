import api from '@/api/axios';
import type { ApiResponse, ApiUser } from '@/api/types';
import { clearTokens, saveTokens } from '@/utils/storage';

export async function login(email: string, password: string) {
  try {
    const { data } = await api.post<
      ApiResponse<{ user: ApiUser; accessToken: string; refreshToken: string }>
    >('/auth/login', { email, password });
    await saveTokens(data.data.accessToken, data.data.refreshToken);
  
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function register(
  name: string,
  email: string,
  phone: string,
  password: string,
  role: 'resident' | 'worker',
  profession?: string | string[],
  cnicFront?: string,
  cnicBack?: string,
) {
  try {
    const { data } = await api.post<
      ApiResponse<{ user: ApiUser; accessToken: string; refreshToken: string }>
    >('/auth/register', { name, email, phone, password, role, profession, cnicFront, cnicBack });
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  } catch (error) {
    console.log(error)
    throw error;
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
  } finally {
    await clearTokens();
  }
}

export async function refreshToken() {
  try {
    const { getRefreshToken } = await import('@/utils/storage');
    const token = await getRefreshToken();
    if (!token) throw new Error('No refresh token');

    const { data } = await api.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >('/auth/refresh-token', { refreshToken: token });
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function getMe() {
  try {
    const { data } = await api.get<ApiResponse<{ user: ApiUser }>>('/auth/me');
    console.log('USER FROM API:', JSON.stringify(data.data.user, null, 2));
    return data.data.user;

  } catch (error) {
    throw error;
  }
}

export async function sendOtp(identifier: string, purpose = 'password_reset') {
  try {
    const { data } = await api.post<ApiResponse<{ expiresIn: number }>>(
      '/auth/send-otp',
      {
        identifier,
        purpose,
      },
    );
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function verifyOtp(
  identifier: string,
  code: string,
  purpose = 'password_reset',
) {
  try {
    const { data } = await api.post<ApiResponse<{ verified: boolean }>>(
      '/auth/verify-otp',
      {
        identifier,
        code,
        purpose,
      },
    );
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function forgotPassword(email: string) {
  try {
    const { data } = await api.post<ApiResponse<{ expiresIn: number }>>(
      '/auth/forgot-password',
      {
        email,
      },
    );
    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function resetPassword(
  identifier: string,
  code: string,
  newPassword: string,
) {
  try {
    const { data } = await api.post<ApiResponse<null>>('/auth/reset-password', {
      identifier,
      code,
      newPassword,
    });
    return data;
  } catch (error) {
    throw error;
  }
}
export async function checkEmail(email: string) {
  try {
    const { data } = await api.post<ApiResponse<{ exists: boolean }>>(
      '/auth/check-email',
      { email },
    );
    return data.data;
  } catch (error) {
    throw error;
  }
}


export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message: string;
};

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/
export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const { data } =
    await api.post<ChangePasswordResponse>(
      'admin/change-password',
      {
        currentPassword,
        newPassword,
      },
    );

  return data;
}
 