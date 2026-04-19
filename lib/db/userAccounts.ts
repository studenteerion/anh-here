import pool from "@/lib/db";
import { UserAccount, UserAccountFilter } from "@/types/userAccounts";
import { deleteTokensByUser } from "@/lib/db/refreshTokens";
import { ResultSetHeader, RowDataPacket } from "mysql2";

type AccountRow = RowDataPacket & UserAccount & { global_user_id: number };

export async function getAllUserAccounts(
  tenantId: number,
  filters?: UserAccountFilter
): Promise<UserAccount[]> {
  let query = `
    SELECT gut.employee_id,
           gu.email,
           gut.created_at,
           gut.updated_at,
           COALESCE(gut.last_login, gu.last_login) AS last_login
    FROM global_users_tenants gut
    JOIN global_users gu ON gu.id = gut.global_user_id
    WHERE gut.tenant_id = ?`;
  const params: (string | number)[] = [tenantId];

  if (filters?.status === "active") {
    query += ` AND COALESCE(gut.last_login, gu.last_login) IS NOT NULL
               AND COALESCE(gut.last_login, gu.last_login) > DATE_SUB(NOW(), INTERVAL 30 DAY)`;
  } else if (filters?.status === "inactive") {
    query += ` AND (COALESCE(gut.last_login, gu.last_login) IS NULL
               OR COALESCE(gut.last_login, gu.last_login) <= DATE_SUB(NOW(), INTERVAL 30 DAY))`;
  }

  query += ` ORDER BY gut.created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows] = await pool.query<AccountRow[]>(query, params);
  return rows;
}

export async function getUserAccountsCount(
  tenantId: number,
  filters?: { status?: "active" | "inactive" }
): Promise<number> {
  let query = `
    SELECT COUNT(*) as total
    FROM global_users_tenants gut
    JOIN global_users gu ON gu.id = gut.global_user_id
    WHERE gut.tenant_id = ?`;
  const params: (string | number)[] = [tenantId];

  if (filters?.status === "active") {
    query += ` AND COALESCE(gut.last_login, gu.last_login) IS NOT NULL
               AND COALESCE(gut.last_login, gu.last_login) > DATE_SUB(NOW(), INTERVAL 30 DAY)`;
  } else if (filters?.status === "inactive") {
    query += ` AND (COALESCE(gut.last_login, gu.last_login) IS NULL
               OR COALESCE(gut.last_login, gu.last_login) <= DATE_SUB(NOW(), INTERVAL 30 DAY))`;
  }

  const [result] = await pool.query<Array<RowDataPacket & { total: number }>>(query, params);
  return result[0]?.total || 0;
}

export async function getUserAccountByEmployeeId(
  tenantId: number,
  employeeId: number
): Promise<UserAccount | null> {
  const [rows] = await pool.query<AccountRow[]>(
    `
      SELECT gut.employee_id,
             gu.email,
             gut.created_at,
             gut.updated_at,
             COALESCE(gut.last_login, gu.last_login) AS last_login,
             gut.global_user_id
      FROM global_users_tenants gut
      JOIN global_users gu ON gu.id = gut.global_user_id
      WHERE gut.tenant_id = ? AND gut.employee_id = ?
      LIMIT 1
    `,
    [tenantId, employeeId]
  );
  return rows[0] || null;
}

export async function getUserAccountByEmail(
  tenantId: number,
  email: string
): Promise<UserAccount | null> {
  const [rows] = await pool.query<AccountRow[]>(
    `
      SELECT gut.employee_id,
             gu.email,
             gut.created_at,
             gut.updated_at,
             COALESCE(gut.last_login, gu.last_login) AS last_login,
             gut.global_user_id
      FROM global_users_tenants gut
      JOIN global_users gu ON gu.id = gut.global_user_id
      WHERE gut.tenant_id = ? AND gu.email = ?
      LIMIT 1
    `,
    [tenantId, email]
  );
  return rows[0] || null;
}

export async function updateUserAccountEmail(
  tenantId: number,
  employeeId: number,
  newEmail: string
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE global_users gu
      JOIN global_users_tenants gut ON gut.global_user_id = gu.id
      SET gu.email = ?, gu.updated_at = NOW()
      WHERE gut.tenant_id = ? AND gut.employee_id = ?
    `,
    [newEmail, tenantId, employeeId]
  );
  return result.affectedRows > 0;
}

export async function updateUserAccountPassword(
  tenantId: number,
  employeeId: number,
  passwordHash: string
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE global_users gu
      JOIN global_users_tenants gut ON gut.global_user_id = gu.id
      SET gu.password_hash = ?, gu.updated_at = NOW()
      WHERE gut.tenant_id = ? AND gut.employee_id = ?
    `,
    [passwordHash, tenantId, employeeId]
  );
  return result.affectedRows > 0;
}

export async function updateLastLogin(tenantId: number, employeeId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE global_users gu
      JOIN global_users_tenants gut ON gut.global_user_id = gu.id
      SET gut.last_login = NOW(), gu.last_login = NOW()
      WHERE gut.tenant_id = ? AND gut.employee_id = ?
    `,
    [tenantId, employeeId]
  );
  return result.affectedRows > 0;
}

export async function updateGlobalUserLastLogin(globalUserId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE global_users SET last_login = NOW(), updated_at = NOW() WHERE id = ?`,
    [globalUserId]
  );
  return result.affectedRows > 0;
}

export async function deleteUserAccount(tenantId: number, employeeId: number): Promise<boolean> {
  await deleteTokensByUser(tenantId, employeeId);

  const [rows] = await pool.query<Array<RowDataPacket & { global_user_id: number }>>(
    `SELECT global_user_id FROM global_users_tenants WHERE tenant_id = ? AND employee_id = ? LIMIT 1`,
    [tenantId, employeeId]
  );
  if (!rows[0]) return false;

  const globalUserId = rows[0].global_user_id;

  const [deleteMembership] = await pool.query<ResultSetHeader>(
    `DELETE FROM global_users_tenants WHERE tenant_id = ? AND employee_id = ?`,
    [tenantId, employeeId]
  );

  if (deleteMembership.affectedRows === 0) return false;

  const [remainingMemberships] = await pool.query<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM global_users_tenants WHERE global_user_id = ?`,
    [globalUserId]
  );

  if ((remainingMemberships[0]?.total || 0) === 0) {
    await pool.query(`DELETE FROM global_users WHERE id = ?`, [globalUserId]);
  }

  return true;
}

export async function getUserAccountByEmailExcluding(
  tenantId: number,
  email: string,
  excludeEmployeeId: number
): Promise<UserAccount | null> {
  const [rows] = await pool.query<AccountRow[]>(
    `
      SELECT gut.employee_id,
             gu.email,
             gut.created_at,
             gut.updated_at,
             COALESCE(gut.last_login, gu.last_login) AS last_login,
             gut.global_user_id
      FROM global_users_tenants gut
      JOIN global_users gu ON gu.id = gut.global_user_id
      WHERE gu.email = ?
        AND NOT (gut.tenant_id = ? AND gut.employee_id = ?)
      LIMIT 1
    `,
    [email, tenantId, excludeEmployeeId]
  );
  return rows[0] || null;
}
