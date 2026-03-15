/**
 * Company Reports domain types
 */

export interface CompanyReport {
  id: number;
  employee_id: number;
  created_at: Date;
  link: string;
}

export interface CompanyReportFilter {
  employeeId?: number;
  limit?: number;
  offset?: number;
}

export interface CompanyReportResponse {
  id: number;
  employeeId: number;
  createdAt: Date;
  link: string;
}
