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

export async function getEmployeesByRole(
  roleId: number,
  filters?: {
    status?: 'active' | 'inactive';
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  let query = `SELECT id, first_name, last_name, role_id, department_id, status, created_at, updated_at
    FROM employees WHERE role_id = ?`;
  const params: any[] = [roleId];

  if (filters?.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query += ` AND (
      first_name LIKE ? OR
      last_name LIKE ? OR
      CONCAT(first_name, ' ', last_name) LIKE ? OR
      CAST(id AS CHAR) LIKE ?
    )`;
    params.push(term, term, term, term);
  }

  query += ` ORDER BY first_name ASC, last_name ASC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows;
}
