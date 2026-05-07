import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

type PlatformUserRow = RowDataPacket & {
  id: number; // global_user_id
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  status: "active" | "inactive";
  last_login: string | null;
};

export async function getPlatformUserByEmail(email: string) {
  const [rows] = await pool.query<PlatformUserRow[]>(
    `SELECT gu.id,
            gu.email,
            gu.password_hash,
            gu.status,
            gu.last_login,
            (
              SELECT e.first_name
              FROM global_users_tenants gut
              JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
              WHERE gut.global_user_id = gu.id
              ORDER BY gut.is_default DESC, gut.tenant_id ASC
              LIMIT 1
            ) AS first_name,
            (
              SELECT e.last_name
              FROM global_users_tenants gut
              JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
              WHERE gut.global_user_id = gu.id
              ORDER BY gut.is_default DESC, gut.tenant_id ASC
              LIMIT 1
            ) AS last_name
     FROM global_users gu
     JOIN global_users_platform gup ON gup.global_user_id = gu.id
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function getPlatformUserById(platformUserId: number) {
  const [rows] = await pool.query<PlatformUserRow[]>(
    `SELECT gu.id,
            gu.email,
            gu.password_hash,
            gu.status,
            gu.last_login,
            (
              SELECT e.first_name
              FROM global_users_tenants gut
              JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
              WHERE gut.global_user_id = gu.id
              ORDER BY gut.is_default DESC, gut.tenant_id ASC
              LIMIT 1
            ) AS first_name,
            (
              SELECT e.last_name
              FROM global_users_tenants gut
              JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
              WHERE gut.global_user_id = gu.id
              ORDER BY gut.is_default DESC, gut.tenant_id ASC
              LIMIT 1
            ) AS last_name
     FROM global_users gu
     JOIN global_users_platform gup ON gup.global_user_id = gu.id
     WHERE gu.id = ?
     LIMIT 1`,
    [platformUserId]
  );
  return rows[0] || null;
}

export async function updatePlatformUserLastLogin(platformUserId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE global_users gu
     JOIN global_users_platform gup ON gup.global_user_id = gu.id
     SET gu.last_login = NOW(), gu.updated_at = NOW()
     WHERE gu.id = ?`,
    [platformUserId]
  );
  return result.affectedRows > 0;
}
