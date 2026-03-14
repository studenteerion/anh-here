/**
 * Permission domain types
 */

export interface Permission {
  id: number;
  permission_code: string;
  description: string;
}

export interface PermissionException {
  id: number;
  employee_id: number;
  permission_id: number;
  is_allowed: number;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
  allowed: number;
}

export interface PermissionFilter {
  limit?: number;
  offset?: number;
}

export interface PermissionResponse {
  id: number;
  permissionCode: string;
  description: string;
}
