/**
 * Employee domain types
 */

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role_id: number;
  department_id: number;
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export interface EmployeeFilter {
  limit?: number;
  offset?: number;
}
