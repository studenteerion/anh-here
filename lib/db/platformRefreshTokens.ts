import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

const REFRESH_TOKEN_DAYS = 7;

export async function storePlatformRefreshToken(platformUserId: number, tokenHash: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await pool.query(
    `INSERT INTO platform_refresh_tokens (platform_user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [platformUserId, tokenHash, expiresAt]
  );
}

export async function findPlatformTokenByHash(tokenHash: string) {
  const [rows] = await pool.query<Array<RowDataPacket & { id: number; platform_user_id: number }>>(
    `SELECT id, platform_user_id
     FROM platform_refresh_tokens
     WHERE token_hash = ? AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function deletePlatformTokenByHash(tokenHash: string) {
  await pool.query(`DELETE FROM platform_refresh_tokens WHERE token_hash = ?`, [tokenHash]);
}

export async function deletePlatformTokensByUser(platformUserId: number) {
  await pool.query(`DELETE FROM platform_refresh_tokens WHERE platform_user_id = ?`, [platformUserId]);
}
