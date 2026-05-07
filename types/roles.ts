/**
 * Role domain types
 */

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RoleFilter {
  limit?: number;
  offset?: number;
}
