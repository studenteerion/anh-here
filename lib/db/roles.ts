import pool from "@/lib/db";
import { Role, RoleFilter } from "@/types/roles";
import { countRows, getById, getByField, insert, updateById, deleteById, exists } from "./utils";

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

export async function getRoleById(roleId: number): Promise<Role | null> {
  return await getById<Role>(
    'roles',
    roleId,
    'id, role_name'
  );
}

export async function getRoleByName(roleName: string): Promise<Role | null> {
  return await getByField<Role>(
    'roles',
    'role_name',
    roleName,
    'id, role_name'
  );
}

export async function createRole(roleName: string): Promise<number> {
  return await insert('roles', { role_name: roleName });
}

export async function updateRole(roleId: number, roleName: string): Promise<boolean> {
  return await updateById('roles', roleId, { role_name: roleName });
}

export async function deleteRole(roleId: number): Promise<boolean> {
  return await deleteById('roles', roleId);
}
