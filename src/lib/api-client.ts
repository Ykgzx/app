// Type-Safe Frontend API Client for Municipal Equipment Management System
import {
  ApiResponse,
  LoginRequestDto,
  LoginResponseDto,
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  RestockMaterialDto,
  CreateRequestDto,
  ApproveRequestDto,
  RejectRequestDto,
  CancelRequestDto,
  ProcessReturnDto,
  CreateActivityLogDto,
  RequestType,
} from './types/api';
import { User, Category, Material, ActivityLog } from '@/app/data/types';
import { EnhancedRequest, ReturnRecord } from '@/app/data/store';

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await res.json();
    return data as ApiResponse<T>;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Network error';
    return {
      success: false,
      error: message,
    };
  }
}

export const api = {
  // ==========================================
  // AUTH
  // ==========================================
  auth: {
    login: (body: LoginRequestDto) =>
      fetcher<LoginResponseDto>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getProfile: (userId?: string) =>
      fetcher<User>(`/api/auth/me${userId ? `?userId=${userId}` : ''}`),

    changePassword: (body: ChangePasswordDto) =>
      fetcher('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // ==========================================
  // USERS
  // ==========================================
  users: {
    getAll: (params?: { search?: string; role?: string; department?: string }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.role) sp.set('role', params.role);
      if (params?.department) sp.set('department', params.department);
      const qs = sp.toString() ? `?${sp.toString()}` : '';
      return fetcher<User[]>(`/api/users${qs}`);
    },

    getById: (id: string) => fetcher<User>(`/api/users/${id}`),

    create: (body: CreateUserDto) =>
      fetcher<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: string, body: UpdateUserDto) =>
      fetcher<User>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    delete: (id: string) =>
      fetcher(`/api/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  categories: {
    getAll: () => fetcher<Category[]>('/api/categories'),

    getById: (id: string) => fetcher<Category>(`/api/categories/${id}`),

    create: (body: CreateCategoryDto) =>
      fetcher<Category>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: string, body: UpdateCategoryDto) =>
      fetcher<Category>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    delete: (id: string) =>
      fetcher(`/api/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==========================================
  // MATERIALS
  // ==========================================
  materials: {
    getAll: (params?: { search?: string; categoryId?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.categoryId) sp.set('categoryId', params.categoryId);
      if (params?.status) sp.set('status', params.status);
      const qs = sp.toString() ? `?${sp.toString()}` : '';
      return fetcher<Material[]>(`/api/materials${qs}`);
    },

    getById: (id: string) => fetcher<Material>(`/api/materials/${id}`),

    create: (body: CreateMaterialDto) =>
      fetcher<Material>('/api/materials', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: string, body: UpdateMaterialDto) =>
      fetcher<Material>(`/api/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    delete: (id: string) =>
      fetcher(`/api/materials/${id}`, {
        method: 'DELETE',
      }),

    restock: (id: string, body: RestockMaterialDto) =>
      fetcher<Material>(`/api/materials/${id}/restock`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // ==========================================
  // REQUESTS (Requisition & Borrow)
  // ==========================================
  requests: {
    getAll: (params?: { requesterId?: string; status?: string; type?: RequestType }) => {
      const sp = new URLSearchParams();
      if (params?.requesterId) sp.set('requesterId', params.requesterId);
      if (params?.status) sp.set('status', params.status);
      if (params?.type) sp.set('type', params.type);
      const qs = sp.toString() ? `?${sp.toString()}` : '';
      return fetcher<EnhancedRequest[]>(`/api/requests${qs}`);
    },

    getById: (id: string) => fetcher<EnhancedRequest>(`/api/requests/${id}`),

    create: (body: CreateRequestDto) =>
      fetcher<EnhancedRequest>('/api/requests', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    approve: (id: string, body?: ApproveRequestDto) =>
      fetcher<EnhancedRequest>(`/api/requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      }),

    reject: (id: string, body: RejectRequestDto) =>
      fetcher<EnhancedRequest>(`/api/requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    cancel: (id: string, body?: CancelRequestDto) =>
      fetcher<EnhancedRequest>(`/api/requests/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      }),
  },

  // ==========================================
  // RETURNS
  // ==========================================
  returns: {
    getAll: () => fetcher<ReturnRecord[]>('/api/returns'),

    process: (body: ProcessReturnDto) =>
      fetcher<ReturnRecord>('/api/returns', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================
  logs: {
    getAll: (params?: { type?: string; module?: string; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.type) sp.set('type', params.type);
      if (params?.module) sp.set('module', params.module);
      if (params?.limit) sp.set('limit', String(params.limit));
      const qs = sp.toString() ? `?${sp.toString()}` : '';
      return fetcher<ActivityLog[]>(`/api/logs${qs}`);
    },

    create: (body: CreateActivityLogDto) =>
      fetcher<ActivityLog>('/api/logs', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // ==========================================
  // DASHBOARD & STATS
  // ==========================================
  dashboard: {
    getStats: () => fetcher<Record<string, unknown>>('/api/dashboard/stats'),
  },
};
