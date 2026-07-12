import {apiClient} from './client';

export interface AdminRole {
  name: string;
  label?: string | null;
  permissions: string[];
}

export interface AdminDepartment {
  name: string;
  label?: string | null;
  moduleKey: string;
  defaultRole?: {name: string; label?: string | null} | null;
}

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  role?: {name: string; label?: string | null; permissions?: string[]} | null;
  department?: {name: string; label?: string | null; moduleKey?: string} | null;
}

export interface AdminStats {
  users: number;
  managers: number;
  departments: number;
  roles: number;
}

export interface AdminUserFilters {
  department?: string;
  role?: string;
  search?: string;
}

export interface CreateDepartmentUserBody {
  email: string;
  department: string;
  role?: string;
  name?: string;
  phoneNumber?: string;
}

export interface UpdateUserBody {
  name?: string;
  phoneNumber?: string;
  department?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateDepartmentBody {
  name: string;
  label?: string;
  moduleKey: string;
  roleId?: string;
}

export interface CreateRoleBody {
  name: string;
  label?: string;
  permissions?: string[];
}

/** Super-admin endpoints (all require a SUPER_ADMIN bearer token). */
export const adminApi = {
  stats: async (): Promise<AdminStats> =>
    (await apiClient.get<AdminStats>('/admin/stats')).data,

  listUsers: async (filters?: AdminUserFilters): Promise<AdminUser[]> =>
    (await apiClient.get<AdminUser[]>('/admin/users', {params: filters})).data,

  createDepartmentUser: async (
    body: CreateDepartmentUserBody,
  ): Promise<AdminUser> =>
    (await apiClient.post<AdminUser>('/admin/department-users', body)).data,

  updateUser: async (id: string, body: UpdateUserBody): Promise<AdminUser> =>
    (await apiClient.patch<AdminUser>(`/admin/users/${id}`, body)).data,

  listRoles: async (): Promise<AdminRole[]> =>
    (await apiClient.get<AdminRole[]>('/roles')).data,

  createRole: async (body: CreateRoleBody): Promise<AdminRole> =>
    (await apiClient.post<AdminRole>('/roles', body)).data,

  listDepartments: async (): Promise<AdminDepartment[]> =>
    (await apiClient.get<AdminDepartment[]>('/departments')).data,

  createDepartment: async (
    body: CreateDepartmentBody,
  ): Promise<AdminDepartment> =>
    (await apiClient.post<AdminDepartment>('/departments', body)).data,
};
