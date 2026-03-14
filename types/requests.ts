/**
 * Leave Request domain types
 */

export interface LeaveRequest {
  id: number;
  employee_id: number;
  request_date: Date;
  start_datetime: Date;
  end_datetime: Date;
  type: "sick" | "vacation" | "personal" | "other";
  motivation?: string;
  approver1_id?: number;
  approver1_status?: "pending" | "approved" | "rejected";
  approver1_date?: Date;
  approver2_id?: number;
  approver2_status?: "pending" | "approved" | "rejected";
  approver2_date?: Date;
  status: "pending" | "approved" | "rejected";
}

export interface LeaveRequestFilter {
  status?: LeaveRequest["status"];
  limit?: number;
  offset?: number;
}

export interface LeaveRequestResponse {
  id: number;
  type: string;
  startDate: Date;
  endDate: Date;
  motivation?: string;
  status: string;
  requestedAt: Date;
  approver1Status?: string;
  approver2Status?: string;
}
