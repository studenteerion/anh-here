import pool from "@/lib/db";

export async function getAllRoles(limit?: number, offset?: number) {
  const query = `
    SELECT id, role_name
    FROM roles
    ORDER BY role_name ASC
    ${limit ? "LIMIT ? OFFSET ?" : ""}
  `;
  
  const params = limit ? [limit, offset || 0] : [];
  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getRolesCount() {
  const [result]: any = await pool.query("SELECT COUNT(*) as total FROM roles");
  return result[0]?.total || 0;
}

export async function getRoleById(roleId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, role_name
     FROM roles WHERE id = ? LIMIT 1`,
    [roleId]
  );
  return rows[0] || null;
}

export async function getRoleByName(roleName: string) {
  const [rows]: any = await pool.query(
    `SELECT id, role_name
     FROM roles WHERE role_name = ? LIMIT 1`,
    [roleName]
  );
  return rows[0] || null;
}

export async function createRole(roleName: string) {
  const [result]: any = await pool.query(
    `INSERT INTO roles (role_name)
     VALUES (?)`,
    [roleName]
  );

  return result.insertId;
}

export async function updateRole(roleId: number, roleName: string) {
  const [result]: any = await pool.query(
    `UPDATE roles SET role_name = ? WHERE id = ?`,
    [roleName, roleId]
  );

  return result.affectedRows > 0;
}

export async function deleteRole(roleId: number) {
  const [result]: any = await pool.query(
    `DELETE FROM roles WHERE id = ?`,
    [roleId]
  );

  return result.affectedRows > 0;
}
