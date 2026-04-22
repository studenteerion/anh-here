import pool from "@/lib/db";
import { Employee } from "@/types/employees";
import { getById } from "./utils";

export async function getAllEmployees(
  tenantId: number,
  filters?: {
    status?: Employee["status"];
    search?: string;
    sortBy?: "created_at" | "first_name" | "last_name" | "id";
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }
): Promise<unknown[]> {
  let query = `SELECT
      e.id,
      e.first_name,
      e.last_name,
      e.role_id,
      e.department_id,
      e.status,
      e.created_at,
      e.updated_at,
      r.role_name,
      d.department_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id AND e.tenant_id = r.tenant_id
    LEFT JOIN departments d ON e.department_id = d.id AND e.tenant_id = d.tenant_id
    WHERE e.tenant_id = ?`;

  const params: unknown[] = [tenantId];

  if (filters?.status) {
    query += ` AND e.status = ?`;
    params.push(filters.status);
  }

  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query += ` AND (
      e.first_name LIKE ? OR
      e.last_name LIKE ? OR
      CONCAT(e.first_name, ' ', e.last_name) LIKE ? OR
      CAST(e.id AS CHAR) LIKE ?
    )`;
    params.push(term, term, term, term);
  }

  const sortMap: Record<string, string> = {
    created_at: "e.created_at",
    first_name: "e.first_name",
    last_name: "e.last_name",
    id: "e.id",
  };

  const safeSortBy = sortMap[filters?.sortBy || "created_at"] || "e.created_at";
  const safeSortOrder = (filters?.sortOrder || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
  query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: unknown = await pool.query(query, params);
  return rows;
}

export async function getEmployeesCount(
  tenantId: number,
  filters?: {
    status?: Employee["status"];
    search?: string;
  }
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM employees WHERE tenant_id = ?`;
  const params: unknown[] = [tenantId];

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

  const [rows]: unknown = await pool.query(query, params);
  return rows[0]?.total || 0;
}

export async function getEmployeeById(tenantId: number, employeeId: number) {
  return await getById<Employee>(
    "employees",
    tenantId,
    employeeId,
    "id, first_name, last_name, role_id, department_id, status, created_at, updated_at"
  );
}

export async function getEmployeesByDepartment(
  tenantId: number,
  departmentId: number,
  filters?: {
    status?: Employee["status"];
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  let query = `SELECT id, first_name, last_name, role_id, department_id, status, created_at, updated_at
     FROM employees WHERE tenant_id = ? AND department_id = ?`;

  const params: unknown[] = [tenantId, departmentId];

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

  query += ` ORDER BY first_name ASC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: unknown = await pool.query(query, params);
  return rows;
}

export async function createEmployee(
  tenantId: number,
  firstName: string,
  lastName: string,
  roleId: number,
  departmentId: number,
  email: string,
  passwordHash: string
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result]: unknown = await connection.query(
      `INSERT INTO employees (tenant_id, first_name, last_name, role_id, department_id, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [tenantId, firstName, lastName, roleId, departmentId]
    );

    const employeeId = result.insertId;

    const [existingGlobalUsers]: unknown = await connection.query(
      `SELECT id, password_hash FROM global_users WHERE email = ? LIMIT 1`,
      [email]
    );

    let globalUserId: number;
    if (existingGlobalUsers[0]) {
      if (existingGlobalUsers[0].password_hash !== passwordHash) {
        throw Object.assign(new Error("Global user already exists with a different password"), { code: "ER_DUP_ENTRY" });
      }
      globalUserId = Number(existingGlobalUsers[0].id);
    } else {
      const [globalResult]: unknown = await connection.query(
        `INSERT INTO global_users (email, password_hash, status) VALUES (?, ?, 'active')`,
        [email, passwordHash]
      );
      globalUserId = Number(globalResult.insertId);
    }

    await connection.query(
      `INSERT INTO global_users_tenants (global_user_id, tenant_id, employee_id, status, is_default)
       VALUES (?, ?, ?, 'active', 0)`,
      [globalUserId, tenantId, employeeId]
    );

    const [defaultRows]: unknown = await connection.query(
      `SELECT COUNT(*) AS total_defaults
       FROM global_users_tenants
       WHERE global_user_id = ? AND is_default = 1`,
      [globalUserId]
    );

    if ((defaultRows[0]?.total_defaults || 0) === 0) {
      await connection.query(
        `UPDATE global_users_tenants
         SET is_default = 1
         WHERE global_user_id = ? AND tenant_id = ?`,
        [globalUserId, tenantId]
      );
    }

    await connection.commit();
    return employeeId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateEmployee(
  tenantId: number,
  employeeId: number,
  updates: {
    firstName?: string;
    lastName?: string;
    roleId?: number;
    departmentId?: number;
    status?: "active" | "inactive";
  }
) {
  const updateFields: Record<string, unknown> = {};

  if (updates.firstName) updateFields["first_name"] = updates.firstName;
  if (updates.lastName) updateFields["last_name"] = updates.lastName;
  if (updates.roleId) updateFields["role_id"] = updates.roleId;
  if (updates.departmentId) updateFields["department_id"] = updates.departmentId;
  if (updates.status) updateFields["status"] = updates.status;

  if (Object.keys(updateFields).length === 0) {
    return false;
  }

  const setClauses = Object.keys(updateFields).map((key) => `${key} = ?`);
  const values = Object.values(updateFields);
  values.push(tenantId, employeeId);

  const [result]: unknown = await pool.query(
    `UPDATE employees SET ${setClauses.join(", ")} WHERE tenant_id = ? AND id = ?`,
    values
  );

  return result.affectedRows > 0;
}

export async function deleteEmployee(tenantId: number, employeeId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [membershipRows]: unknown = await connection.query(
      `SELECT global_user_id FROM global_users_tenants WHERE tenant_id = ? AND employee_id = ? LIMIT 1`,
      [tenantId, employeeId]
    );
    const globalUserId = membershipRows[0]?.global_user_id as number | undefined;

    const [result]: unknown = await connection.query(
      `DELETE FROM employees WHERE tenant_id = ? AND id = ?`,
      [tenantId, employeeId]
    );

    if (result.affectedRows > 0 && globalUserId) {
      const [remainingRows]: unknown = await connection.query(
        `SELECT COUNT(*) AS total FROM global_users_tenants WHERE global_user_id = ?`,
        [globalUserId]
      );
      if ((remainingRows[0]?.total || 0) === 0) {
        await connection.query(`DELETE FROM global_users WHERE id = ?`, [globalUserId]);
      }
    }

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
