import apiClient from '@/lib/api-client';
import { Role, Permission, CreatePermissionPayload, UpdatePermissionPayload } from '../types/permissions.types';

export const permissionsApi = {
  // Roles
  getRoles: () => apiClient.get('/roles').then((res) => res.data.data),
  
  getRolePermissions: (roleId: string) => 
    apiClient.get(`/roles/${roleId}/permissions`).then((res) => res.data.data),
    
  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    apiClient.put(`/roles/${roleId}/permissions`, { permissionIds }).then((res) => res.data.data),

  // Permissions Master List
  getPermissions: () => apiClient.get('/permissions').then((res) => res.data.data),
  
  createPermission: (data: CreatePermissionPayload) =>
    apiClient.post('/permissions', data).then((res) => res.data.data),
    
  updatePermission: (id: string, data: UpdatePermissionPayload) =>
    apiClient.put(`/permissions/${id}`, data).then((res) => res.data.data),
    
  deletePermission: (id: string) =>
    apiClient.delete(`/permissions/${id}`).then((res) => res.data.data),
};
