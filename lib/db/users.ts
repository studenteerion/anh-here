import pool from "@/lib/db";

export async function getUserByEmail(email: string) {
    const [rows]: any = await pool.query(
        `
            SELECT ua.email,
                   ua.employee_id,
                   ua.password_hash,
                   e.role_id,
                   e.first_name,
                   e.last_name
            FROM user_accounts ua
                     JOIN employees e ON ua.employee_id = e.id
            WHERE ua.email = ? LIMIT 1
        `,
        [email]
    );

    return rows[0] || null;
}

export async function getUserById(employeeId: number) {
    const [rows]: any = await pool.query(
        `
            SELECT ua.email,
                   ua.employee_id,
                   ua.password_hash,
                   e.role_id,
                   e.first_name,
                   e.last_name
            FROM user_accounts ua
                     JOIN employees e ON ua.employee_id = e.id
            WHERE ua.employee_id = ? LIMIT 1
        `,
        [employeeId]
    );

    return rows[0] || null;
}

export async function updateUserPassword(employeeId: number, newPasswordHash: string) {
    const [result]: any = await pool.query(
        `UPDATE user_accounts SET password_hash = ? WHERE employee_id = ?`,
        [newPasswordHash, employeeId]
    );

    return result.affectedRows > 0;
}

export async function getUserPasswordHash(employeeId: number) {
    const [rows]: any = await pool.query(
        `SELECT password_hash FROM user_accounts WHERE employee_id = ? LIMIT 1`,
        [employeeId]
    );

    return rows[0]?.password_hash || null;
}