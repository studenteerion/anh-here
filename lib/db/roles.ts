import pool from "@/lib/db";
import { Role, RoleFilter } from "@/types/roles";

export async function getAllRoles(filters?: RoleFilter): Promise<Role[]> {
  let query = `SELECT id, role_name
    FROM roles ORDER BY role_name ASC`;
  
  const params: any[] = [];

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows as Role[];
}

export async function getRolesCount(): Promise<number> {
  const [result]: any = await pool.query("SELECT COUNT(*) as total FROM roles");
  return result[0]?.total || 0;
}

export async function getRoleById(roleId: number): Promise<Role | null> {
  const [rows]: any = await pool.query(
    `SELECT id, role_name
     FROM roles WHERE id = ? LIMIT 1`,
    [roleId]
  );
  return (rows[0] || null) as Role | null;
}

export async function getRoleByName(roleName: string): Promise<Role | null> {
  const [rows]: any = await pool.query(
    `SELECT id, role_name
     FROM roles WHERE role_name = ? LIMIT 1`,
    [roleName]
  );
  return (rows[0] || null) as Role | null;
}

export async function createRole(roleName: string): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO roles (role_name)
     VALUES (?)`,
    [roleName]
  );

  return result.insertId;
}

export async function updateRole(roleId: number, roleName: string): Promise<boolean> {
  const [result]: any = await pool.query(
    `UPDATE roles SET role_name = ? WHERE id = ?`,
    [roleName, roleId]
  );

  return result.affectedRows > 0;
}

export async function deleteRole(roleId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `DELETE FROM roles WHERE id = ?`,
    [roleId]
  );

  return result.affectedRows > 0;
}
