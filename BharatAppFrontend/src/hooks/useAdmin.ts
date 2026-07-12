import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  adminApi,
  AdminUserFilters,
  CreateDepartmentBody,
  CreateDepartmentUserBody,
  CreateRoleBody,
  UpdateUserBody,
} from '../api/admin.api';

/** Query keys for the admin panel. */
export const ADMIN_KEYS = {
  stats: ['admin', 'stats'] as const,
  users: (filters?: AdminUserFilters) =>
    ['admin', 'users', filters ?? {}] as const,
  roles: ['admin', 'roles'] as const,
  departments: ['admin', 'departments'] as const,
};

export const useAdminStats = () =>
  useQuery({queryKey: ADMIN_KEYS.stats, queryFn: adminApi.stats});

export const useAdminUsers = (filters?: AdminUserFilters) =>
  useQuery({
    queryKey: ADMIN_KEYS.users(filters),
    queryFn: () => adminApi.listUsers(filters),
  });

export const useAdminRoles = () =>
  useQuery({queryKey: ADMIN_KEYS.roles, queryFn: adminApi.listRoles});

export const useAdminDepartments = () =>
  useQuery({queryKey: ADMIN_KEYS.departments, queryFn: adminApi.listDepartments});

export const useCreateDepartmentUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDepartmentUserBody) =>
      adminApi.createDepartmentUser(body),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['admin', 'users']});
      qc.invalidateQueries({queryKey: ADMIN_KEYS.stats});
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, body}: {id: string; body: UpdateUserBody}) =>
      adminApi.updateUser(id, body),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['admin', 'users']});
      qc.invalidateQueries({queryKey: ADMIN_KEYS.stats});
    },
  });
};

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDepartmentBody) => adminApi.createDepartment(body),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ADMIN_KEYS.departments});
      qc.invalidateQueries({queryKey: ADMIN_KEYS.roles});
      qc.invalidateQueries({queryKey: ADMIN_KEYS.stats});
    },
  });
};

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRoleBody) => adminApi.createRole(body),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ADMIN_KEYS.roles});
      qc.invalidateQueries({queryKey: ADMIN_KEYS.stats});
    },
  });
};
