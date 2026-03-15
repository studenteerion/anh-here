/**
 * Attendance domain types
 */

export interface Attendance {
  id: number;
  employee_id: number;
  shift_id: number;
  start_datetime: Date;
  end_datetime?: Date;
  created_at: Date;
}

export interface AttendanceFilter {
  limit?: number;
  offset?: number;
}

export interface AttendanceResponse {
  id: number;
  employeeId: number;
  shiftId: number;
  startDatetime: Date;
  endDatetime?: Date;
  createdAt: Date;
}
