/**
 * Shift domain types
 */

export interface Shift {
  id: number;
  department_id?: number;
  name: string;
  start_time: string;
  end_time: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ShiftFilter {
  limit?: number;
  offset?: number;
}

export interface ShiftResponse {
  id: number;
  departmentId?: number;
  name: string;
  startTime: string;
  endTime: string;
  createdAt?: Date;
  updatedAt?: Date;
}
