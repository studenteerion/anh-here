/**
 * Timesheet domain types
 */

export interface Timesheet {
  id: number;
  employee_id: number;
  punch_in_time: Date;
  punch_out_time?: Date;
  punch_in_location?: string;
  punch_out_location?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TimesheetFilter {
  limit?: number;
  offset?: number;
}

export interface TimesheetResponse {
  id: number;
  employeeId: number;
  punchInTime: Date;
  punchOutTime?: Date;
  punchInLocation?: string;
  punchOutLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}
