/**
 * Database Query Result Types
 * 
 * This file provides proper TypeScript types for mysql2 query results.
 * It eliminates the need for `as any` casts when working with database operations.
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Result from a SELECT query
 * The generic type T is passed directly to pool.query<T>
 * 
 * Usage:
 * ```typescript
 * interface UserRow extends RowDataPacket {
 *   id: number;
 *   email: string;
 * }
 * 
 * const [rows, fields] = await pool.query<UserRow[]>('SELECT * FROM users');
 * // rows is now properly typed as UserRow[]
 * ```
 */

/**
 * Type for array of query parameters
 */
export type QueryParams = (string | number | boolean | null | Date | Buffer)[];

/**
 * Generic row data type for database queries
 * Use this as a base for creating typed row interfaces
 */
export interface BaseRow extends RowDataPacket {
  id?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Common database row types
 * These extend RowDataPacket so they can be used directly with pool.query<RowType>
 */

export interface AnomalyRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  employee_Id: number;
  reporter_id: number;
  resolver_id?: number | null;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  resolution_notes?: string | null;
  created_at: Date;
  resolved_at?: Date | null;
  reporter_name?: string;
  resolver_name?: string;
}

export interface AttendanceRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  employee_id: number;
  shift_id?: number | null;
  punch_in_datetime?: Date | null;
  start_datetime: Date;
  end_datetime?: Date | null;
  status: 'in_progress' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface DepartmentRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  name: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface EmployeeRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  global_user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  department_id: number;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  role_name?: string;
  department_name?: string;
}

export interface LeaveRequestRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  employee_id: number;
  type: string;
  start_datetime: Date;
  end_datetime: Date;
  motivation?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number | null;
  rejection_reason?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PermissionRow extends RowDataPacket {
  id: number;
  permission_code: string;
  description: string;
  created_at: Date;
}

export interface RoleRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface ShiftRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  department_id: number;
  name: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface TenantRow extends RowDataPacket {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface GlobalUserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface UserTenantRow extends RowDataPacket {
  id: number;
  global_user_id: number;
  tenant_id: number;
  employee_id?: number | null;
  status: 'active' | 'inactive';
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CountResultRow extends RowDataPacket {
  total: number;
}

export interface AggregationRow extends RowDataPacket {
  [key: string]: unknown;
}

/**
 * Type helper for safe INSERT/UPDATE/DELETE operations
 * Returns metadata about the operation
 */
export type ModifyResult = ResultSetHeader;

/**
 * Type guard to ensure value is a modification result
 */
export function isModifyResult(value: unknown): value is ResultSetHeader {
  return (
    value !== null &&
    typeof value === 'object' &&
    'affectedRows' in value &&
    'insertId' in value
  );
}
