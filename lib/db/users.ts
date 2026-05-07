import pool from "@/lib/db";
import { updateUserAccountPassword } from "@/lib/db/userAccounts";
import { RowDataPacket } from "mysql2";

type LoginCandidate = RowDataPacket & {
  global_user_id: number;
  email: string;
  password_hash: string;
  global_status: "active" | "inactive";
  tenant_id: number;
  tenant_name: string;
  tenant_status: "active" | "inactive";
  membership_status: "active" | "inactive";
  is_default: 0 | 1;
  employee_id: number;
  employee_status: "active" | "inactive";
  role_id: number;
  first_name: string;
  last_name: string;
  last_login: Date | null;
};

type UserScopedRecord = RowDataPacket & {
  email: string;
  tenant_id: number;
  employee_id: number;
  password_hash: string;
  role_id: number;
  first_name: string;
  last_name: string;
  last_login: Date | null;
  global_user_id: number;
};

export async function getUserByEmail(email: string, tenantId: number) {
  const [rows] = await pool.query<UserScopedRecord[]>(
    `
      SELECT gu.email,
             gut.tenant_id,
             gut.employee_id,
             gu.password_hash,
             e.role_id,
             e.first_name,
             e.last_name,
             COALESCE(gut.last_login, gu.last_login) AS last_login,
             gu.id AS global_user_id
      FROM global_users_tenants gut
      JOIN global_users gu ON gu.id = gut.global_user_id
      JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
      WHERE gu.email = ? AND gut.tenant_id = ?
      LIMIT 1
    `,
    [email, tenantId]
  );

  return rows[0] || null;
}

export async function getUsersByEmailForLogin(email: string) {
  const [rows] = await pool.query<LoginCandidate[]>(
    `
      SELECT gu.id AS global_user_id,
             gu.email,
             gu.password_hash,
             gu.status AS global_status,
             gut.tenant_id,
             t.name AS tenant_name,
             t.status AS tenant_status,
             gut.status AS membership_status,
             gut.is_default,
             gut.employee_id,
             e.status AS employee_status,
             e.role_id,
             e.first_name,
             e.last_name,
             COALESCE(gut.last_login, gu.last_login) AS last_login
      FROM global_users gu
      JOIN global_users_tenants gut ON gut.global_user_id = gu.id
      JOIN tenants t ON t.id = gut.tenant_id
      JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
      WHERE gu.email = ?
      ORDER BY gut.is_default DESC, gut.tenant_id ASC
    `,
    [email]
  );

  return rows;
}

export async function getUserById(employeeId: number, tenantId: number) {
  const [rows] = await pool.query<UserScopedRecord[]>(
    `
      SELECT gu.email,
             gut.tenant_id,
             gut.employee_id,
             gu.password_hash,
             e.role_id,
             e.first_name,
             e.last_name,
             COALESCE(gut.last_login, gu.last_login) AS last_login,
             gu.id AS global_user_id
      FROM global_users_tenants gut
      JOIN global_users gu ON gu.id = gut.global_user_id
      JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
      WHERE gut.employee_id = ? AND gut.tenant_id = ?
      LIMIT 1
    `,
    [employeeId, tenantId]
  );

  return rows[0] || null;
}

export async function getUserByGlobalIdAndTenant(globalUserId: number, tenantId: number) {
  const [rows] = await pool.query<UserScopedRecord[]>(
    `
      SELECT gu.email,
             gut.tenant_id,
             gut.employee_id,
             gu.password_hash,
             e.role_id,
             e.first_name,
             e.last_name,
             COALESCE(gut.last_login, gu.last_login) AS last_login,
             gu.id AS global_user_id
      FROM global_users_tenants gut
      JOIN global_users gu ON gu.id = gut.global_user_id
      JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
      JOIN tenants t ON t.id = gut.tenant_id
      WHERE gut.global_user_id = ?
        AND gut.tenant_id = ?
        AND gu.status = 'active'
        AND gut.status = 'active'
        AND t.status = 'active'
      LIMIT 1
    `,
    [globalUserId, tenantId]
  );

  return rows[0] || null;
}

/**
 * Update user password
 * Delegated to userAccounts.ts for single source of truth
 * @deprecated Use updateUserAccountPassword from userAccounts.ts instead
 */
export async function updateUserPassword(tenantId: number, employeeId: number, newPasswordHash: string) {
  return await updateUserAccountPassword(tenantId, employeeId, newPasswordHash);
}

export async function getUserPasswordHash(tenantId: number, employeeId: number) {
  const [rows] = await pool.query<Array<RowDataPacket & { password_hash: string }>>(
    `
      SELECT gu.password_hash
      FROM global_users_tenants gut
      JOIN global_users gu ON gu.id = gut.global_user_id
      WHERE gut.tenant_id = ? AND gut.employee_id = ?
      LIMIT 1
    `,
    [tenantId, employeeId]
  );

  return rows[0]?.password_hash || null;
}
