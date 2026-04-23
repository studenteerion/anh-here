import pool from "@/lib/db";
import { Role, RoleFilter } from "@/types/roles";
import { getById, getByField, insert, updateById, deleteById } from "./utils";

export async function getAllRoles(
  tenantId: number,
  filters?: RoleFilter
): Promise<Role[]> {
  let query = `SELECT id, role_name
    FROM roles
    WHERE tenant_id = ?
    ORDER BY role_name ASC`;

  const params: unknown[] = [tenantId];

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows as Role[];
}

export async function getRoleById(tenantId: number, roleId: number): Promise<Role | null> {
  return await getById<Role>(
    "roles",
    tenantId,
    roleId,
    "id, role_name"
  );
}

export async function getRoleByName(tenantId: number, roleName: string): Promise<Role | null> {
  return await getByField<Role>(
    "roles",
    tenantId,
    "role_name",
    roleName,
    "id, role_name"
  );
}

export async function createRole(tenantId: number, roleName: string): Promise<number> {
  return await insert("roles", { tenant_id: tenantId, role_name: roleName });
}

export async function updateRole(tenantId: number, roleId: number, roleName: string): Promise<boolean> {
  return await updateById("roles", tenantId, roleId, { role_name: roleName });
}

export async function deleteRole(tenantId: number, roleId: number): Promise<boolean> {
  return await deleteById("roles", tenantId, roleId);
}

export async function getEmployeesByRole(
  tenantId: number,
  roleId: number,
  filters?: {
    status?: "active" | "inactive";
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  let query = `SELECT id, first_name, last_name, role_id, department_id, status, created_at, updated_at
    FROM employees WHERE tenant_id = ? AND role_id = ?`;
  const params: unknown[] = [tenantId, roleId];

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
