import pool from "@/lib/db";
import { UserAccount, UserAccountFilter } from "@/types/userAccounts";

export async function getAllUserAccounts(
  filters?: UserAccountFilter
): Promise<UserAccount[]> {
  let query = `SELECT employee_id, email, created_at, updated_at, last_login FROM user_accounts`;
  const params: any[] = [];

  if (filters?.status === "active") {
    query += ` WHERE last_login IS NOT NULL`;
  } else if (filters?.status === "inactive") {
    query += ` WHERE last_login IS NULL`;
  }

  query += ` ORDER BY created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getUserAccountsCount(
  filters?: { status?: "active" | "inactive" }
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM user_accounts`;
  const params: any[] = [];

  if (filters?.status === "active") {
    query += ` WHERE last_login IS NOT NULL`;
  } else if (filters?.status === "inactive") {
    query += ` WHERE last_login IS NULL`;
  }

  const [result]: any = await pool.query(query, params);
  return result[0]?.total || 0;
}

export async function getUserAccountByEmployeeId(
  employeeId: number
): Promise<UserAccount | null> {
  const [rows]: any = await pool.query(
    `SELECT employee_id, email, created_at, updated_at, last_login FROM user_accounts WHERE employee_id = ?`,
    [employeeId]
  );
  return rows[0] || null;
}

export async function getUserAccountByEmail(
  email: string
): Promise<UserAccount | null> {
  const [rows]: any = await pool.query(
    `SELECT employee_id, email, created_at, updated_at, last_login FROM user_accounts WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

export async function updateUserAccountEmail(
  employeeId: number,
  newEmail: string
): Promise<boolean> {
  const [result]: any = await pool.query(
    `UPDATE user_accounts SET email = ?, updated_at = NOW() WHERE employee_id = ?`,
    [newEmail, employeeId]
  );
  return result.affectedRows > 0;
}

export async function updateUserAccountPassword(
  employeeId: number,
  passwordHash: string
): Promise<boolean> {
  const [result]: any = await pool.query(
    `UPDATE user_accounts SET password_hash = ?, updated_at = NOW() WHERE employee_id = ?`,
    [passwordHash, employeeId]
  );
  return result.affectedRows > 0;
}

export async function updateLastLogin(employeeId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `UPDATE user_accounts SET last_login = NOW() WHERE employee_id = ?`,
    [employeeId]
  );
  return result.affectedRows > 0;
}

export async function deleteUserAccount(employeeId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `DELETE FROM user_accounts WHERE employee_id = ?`,
    [employeeId]
  );
  return result.affectedRows > 0;
}

export async function getUserAccountByEmailExcluding(
  email: string,
  excludeEmployeeId: number
): Promise<UserAccount | null> {
  const [rows]: any = await pool.query(
    `SELECT employee_id, email, created_at, updated_at, last_login FROM user_accounts WHERE email = ? AND employee_id != ?`,
    [email, excludeEmployeeId]
  );
  return rows[0] || null;
}
