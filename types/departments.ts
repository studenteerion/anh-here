/**
 * Department domain types
 */

export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DepartmentFilter {
  limit?: number;
  offset?: number;
}
