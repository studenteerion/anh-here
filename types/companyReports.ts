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
