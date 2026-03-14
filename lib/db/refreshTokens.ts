import pool from "@/lib/db"

const REFRESH_TOKEN_DAYS = 7

export async function storeRefreshToken(data: {
    user_id: number
    refresh_token: string
}) {

    // calcolo scadenza (7 giorni)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS)

    await pool.query(
        `
    INSERT INTO refresh_tokens 
    (token_hash, user_id, expires_at)
    VALUES (?, ?, ?)
    `,
        [
            data.refresh_token,
            data.user_id,
            expiresAt
        ]
    )
}

export async function findTokenByHash(hash: string) {

    const [rows]: any = await pool.query(
        `
    SELECT *
    FROM refresh_tokens
    WHERE token_hash = ?
    AND expires_at > NOW()
    LIMIT 1
    `,
        [hash]
    )

    if (rows.length > 0) {
        return rows[0]
    }

    return null
}

export async function deleteTokenByHash(hash: string) {
    await pool.query(
        `
    DELETE FROM refresh_tokens
    WHERE token_hash = ?
    `,
        [hash]
    );
}

export async function deleteTokensByUser(user_id: number) {
    await pool.query(
        `
    DELETE FROM refresh_tokens
    WHERE user_id = ?
    `,
        [user_id]
    );
}