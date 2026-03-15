/**
 * User Accounts domain types
 */

export interface UserAccount {
  employee_id: number;
  email: string;
  password_hash?: string; // Not returned in responses
  created_at: Date;
  updated_at: Date;
  last_login?: Date | null;
}

export interface UserAccountFilter {
  status?: "active" | "inactive";
  limit?: number;
  offset?: number;
}

export interface UserAccountResponse {
  employeeId: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
  status: "active" | "inactive";
}
