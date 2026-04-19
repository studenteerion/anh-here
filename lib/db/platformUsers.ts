import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

type PlatformUserRow = RowDataPacket & {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: "active" | "inactive";
  last_login: Date | null;
};

export async function getPlatformUserByEmail(email: string) {
  const [rows] = await pool.query<PlatformUserRow[]>(
    `SELECT id, email, password_hash, first_name, last_name, status, last_login
     FROM platform_users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function getPlatformUserById(platformUserId: number) {
  const [rows] = await pool.query<PlatformUserRow[]>(
    `SELECT id, email, password_hash, first_name, last_name, status, last_login
     FROM platform_users
     WHERE id = ?
     LIMIT 1`,
    [platformUserId]
  );
  return rows[0] || null;
}

export async function updatePlatformUserLastLogin(platformUserId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE platform_users
     SET last_login = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [platformUserId]
  );
  return result.affectedRows > 0;
}
