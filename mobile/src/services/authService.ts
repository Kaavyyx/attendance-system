import api from '../api/client';
import { UserProfile } from '../types';

interface LoginPayload {
  identifier: string;
  password: string;
}

interface RegisterPayload {
  full_name: string;
  employee_id: string;
  email: string;
  phone: string;
  password: string;
  branch_id: number;
}

interface LoginResponse {
  access_token: string;
  user: UserProfile;
}

interface RegisterResponse {
  message: string;
  user: UserProfile;
}

interface MeResponse {
  user: UserProfile;
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/auth/login', payload);
  return response.data;
};

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/api/auth/register', payload);
  return response.data;
};

export const getCurrentUser = async (token: string): Promise<UserProfile> => {
  const response = await api.get<MeResponse>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.user;
};

export const getBranches = async (): Promise<Array<{ id: number; branch_name: string; branch_code: string }>> => {
  const response = await api.get<{ branches: Array<{ id: number; branch_name: string; branch_code: string }> }>('/api/branches');
  return response.data.branches;
};
