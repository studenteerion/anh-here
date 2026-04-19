/**
 * Shared dashboard/view-model types (API payloads used by UI components/pages)
 */

export type EmployeeStatus = "active" | "inactive";
export type AnomalyStatus = "open" | "in_progress" | "closed";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface RoleOption {
  id: number;
  role_name: string;
}

export interface DepartmentOption {
  id: number;
  department_name: string;
}

export interface EmployeeTableRow {
  id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name?: string | null;
  department_id: number;
  department_name?: string | null;
  status: EmployeeStatus;
  created_at: string;
}

export interface EmployeeDetailItem {
  id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  department_id: number;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

export interface DepartmentEmployeeItem {
  id: number;
  firstName: string;
  lastName: string;
  roleId: number;
  status: EmployeeStatus;
  createdAt: string;
}

export interface RoleEmployeeItem {
  id: number;
  firstName: string;
  lastName: string;
  departmentId: number;
  status: EmployeeStatus;
  createdAt: string;
}

export interface LeaveRequestSummary {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  motivation?: string;
  status: RequestStatus;
  requestedAt: string;
}

export interface AnomalyListItem {
  id: number;
  description: string;
  status: AnomalyStatus;
  reportedAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  reporterId?: number;
  resolverId?: number;
  reporterName?: string;
  resolverName?: string;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
}

export interface CompanyReportListItem {
  id: number;
  employeeId: number;
  link: string;
  createdAt: string;
}

export interface RolePermissionView {
  id: number;
  permission_code: string;
  description: string;
  assigned: boolean;
}

export interface ShiftEmployeeSummary {
  id: number;
  first_name: string;
  last_name: string;
  status: EmployeeStatus;
  attendance_count?: number;
}

export interface CurrentUserProfile {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: string | null;
  departmentId: number;
  departmentName: string | null;
  status: EmployeeStatus;
  lastLogin: string | null;
}
