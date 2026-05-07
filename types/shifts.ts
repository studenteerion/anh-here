/**
 * Shift domain types
 */

export interface Shift {
  id: number;
  department_id: number;
  name: string | null;
  start_time: string;
  end_time: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ShiftFilter {
  limit?: number;
  offset?: number;
}
