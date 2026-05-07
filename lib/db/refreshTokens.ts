import pool from "@/lib/db"
import { RowDataPacket } from "mysql2";

const REFRESH_TOKEN_DAYS = 7

export async function storeRefreshToken(data: {
    tenant_id: number
    global_user_id: number
    employee_id?: number
    user_id?: number
    refresh_token: string
}) {
    const employeeId = data.employee_id ?? data.user_id;
    if (!employeeId) {
        throw new Error("employee_id is required to store refresh token");
    }

    // calcolo scadenza (7 giorni)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS)

    await pool.query(
        `
    INSERT INTO refresh_tokens 
    (tenant_id, global_user_id, employee_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?, ?)
    `,
        [
            data.tenant_id,
            data.global_user_id,
            employeeId,
            data.refresh_token,
            expiresAt
        ]
    )
}

export async function findTokenByHash(hash: string, tenantId?: number) {
    const tenantFilter = typeof tenantId === "number" ? "AND tenant_id = ?" : "";
    const params: (string | number)[] = tenantId === undefined ? [hash] : [hash, tenantId];

    const [rows] = await pool.query<Array<RowDataPacket & {
        id: number;
        tenant_id: number;
        global_user_id: number;
        employee_id: number;
        user_id: number;
    }>>(
        `
    SELECT id,
           tenant_id,
           global_user_id,
           employee_id,
           employee_id AS user_id,
           token_hash,
           expires_at,
           created_at
    FROM refresh_tokens
    WHERE token_hash = ?
    ${tenantFilter}
    AND expires_at > NOW()
    LIMIT 1
    `,
        params
    )

    if (rows.length > 0) {
        return rows[0]
    }

    return null
}

export async function deleteTokenByHash(hash: string, tenantId?: number) {
    const tenantFilter = typeof tenantId === "number" ? "AND tenant_id = ?" : "";
    const params: (string | number)[] = tenantId === undefined ? [hash] : [hash, tenantId];
    await pool.query(
        `
    DELETE FROM refresh_tokens
    WHERE token_hash = ?
    ${tenantFilter}
    `,
        params
    );
}

export async function deleteTokensByUser(tenantId: number, user_id: number) {
    await pool.query(
        `
    DELETE FROM refresh_tokens
    WHERE tenant_id = ? AND employee_id = ?
    `,
        [tenantId, user_id]
    );
}
