import pool from "@/lib/db";
import { Employee } from "@/types/employees";
import { getById } from "./utils";

export async function getAllEmployees(
  filters?: {
    status?: Employee["status"];
    search?: string;
    sortBy?: "created_at" | "first_name" | "last_name" | "id";
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
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
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id`;

  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filters?.status) {
    whereClauses.push(`e.status = ?`);
    params.push(filters.status);
  }

  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    whereClauses.push(`(
      e.first_name LIKE ? OR
      e.last_name LIKE ? OR
      CONCAT(e.first_name, ' ', e.last_name) LIKE ? OR
      CAST(e.id AS CHAR) LIKE ?
    )`);
    params.push(term, term, term, term);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
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

  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getEmployeesCount(
  filters?: {
    status?: Employee["status"];
    search?: string;
  }
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM employees`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filters?.status) {
    whereClauses.push(`status = ?`);
    params.push(filters.status);
  }

  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    whereClauses.push(`(
      first_name LIKE ? OR
      last_name LIKE ? OR
      CONCAT(first_name, ' ', last_name) LIKE ? OR
      CAST(id AS CHAR) LIKE ?
    )`);
    params.push(term, term, term, term);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  const [rows]: any = await pool.query(query, params);
  return rows[0]?.total || 0;
}

export async function getEmployeeById(employeeId: number) {
  return await getById<Employee>(
    'employees',
    employeeId,
    'id, first_name, last_name, role_id, department_id, status, created_at, updated_at'
  );
}

export async function getEmployeesByDepartment(
  departmentId: number,
  filters?: {
    status?: Employee["status"];
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  let query = `SELECT id, first_name, last_name, role_id, department_id, status, created_at, updated_at
     FROM employees WHERE department_id = ?`;
  
  const params: any[] = [departmentId];

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

  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function createEmployee(
  firstName: string,
  lastName: string,
  roleId: number,
  departmentId: number,
  email: string,
  passwordHash: string
) {
  const [result]: any = await pool.query(
    `INSERT INTO employees (first_name, last_name, role_id, department_id, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [firstName, lastName, roleId, departmentId]
  );

  const employeeId = result.insertId;

  await pool.query(
    `INSERT INTO user_accounts (employee_id, email, password_hash)
     VALUES (?, ?, ?)`,
    [employeeId, email, passwordHash]
  );

  return employeeId;
}

export async function updateEmployee(
  employeeId: number,
  updates: {
    firstName?: string;
    lastName?: string;
    roleId?: number;
    departmentId?: number;
    status?: "active" | "inactive";
  }
) {
  const updateFields: Record<string, any> = {};

  if (updates.firstName) updateFields['first_name'] = updates.firstName;
  if (updates.lastName) updateFields['last_name'] = updates.lastName;
  if (updates.roleId) updateFields['role_id'] = updates.roleId;
  if (updates.departmentId) updateFields['department_id'] = updates.departmentId;
  if (updates.status) updateFields['status'] = updates.status;

  if (Object.keys(updateFields).length === 0) {
    return false;
  }

  const setClauses = Object.keys(updateFields).map((key) => `${key} = ?`);
  const values = Object.values(updateFields);
  values.push(employeeId);

  const [result]: any = await pool.query(
    `UPDATE employees SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
}

export async function deleteEmployee(employeeId: number) {
  await pool.query(
    `DELETE FROM user_accounts WHERE employee_id = ?`,
    [employeeId]
  );

  const [result]: any = await pool.query(
    `DELETE FROM employees WHERE id = ?`,
    [employeeId]
  );

  return result.affectedRows > 0;
}
