import pool from "@/lib/db";
import { Employee, EmployeeFilter } from "@/types/employees";

export async function getAllEmployees(
  filters?: {
    status?: Employee["status"];
    limit?: number;
    offset?: number;
  }
): Promise<Employee[]> {
  let query = `SELECT id, first_name, last_name, role_id, department_id, status, created_at, updated_at
    FROM employees`;
  
  const params: any[] = [];

  if (filters?.status) {
    query += ` WHERE status = ?`;
    params.push(filters.status);
  }

  query += ` ORDER BY created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows as Employee[];
}

export async function getEmployeesCount(filters?: { status?: Employee["status"] }) {
  let query = `SELECT COUNT(*) as total FROM employees`;
  const params: any[] = [];

  if (filters?.status) {
    query += ` WHERE status = ?`;
    params.push(filters.status);
  }

  const [result]: any = await pool.query(query, params);
  return result[0]?.total || 0;
}

export async function getEmployeeById(employeeId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, first_name, last_name, role_id, department_id, status, created_at, updated_at
     FROM employees WHERE id = ? LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
}

export async function getEmployeesByDepartment(
  departmentId: number,
  filters?: {
    status?: Employee["status"];
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

  query += ` ORDER BY first_name ASC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getEmployeesByDepartmentCount(
  departmentId: number,
  filters?: { status?: Employee["status"] }
) {
  let query = `SELECT COUNT(*) as total FROM employees WHERE department_id = ?`;
  const params: any[] = [departmentId];

  if (filters?.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  const [result]: any = await pool.query(query, params);
  return result[0]?.total || 0;
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
  const allowedFields = ["first_name", "last_name", "role_id", "department_id", "status"];
  const setClauses = [];
  const values = [];

  if (updates.firstName) {
    setClauses.push("first_name = ?");
    values.push(updates.firstName);
  }
  if (updates.lastName) {
    setClauses.push("last_name = ?");
    values.push(updates.lastName);
  }
  if (updates.roleId) {
    setClauses.push("role_id = ?");
    values.push(updates.roleId);
  }
  if (updates.departmentId) {
    setClauses.push("department_id = ?");
    values.push(updates.departmentId);
  }
  if (updates.status) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }

  if (setClauses.length === 0) {
    return false;
  }

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

export async function roleExists(roleId: number): Promise<boolean> {
  const [rows]: any = await pool.query(
    `SELECT id FROM roles WHERE id = ? LIMIT 1`,
    [roleId]
  );
  return rows.length > 0;
}

export async function departmentExists(departmentId: number): Promise<boolean> {
  const [rows]: any = await pool.query(
    `SELECT id FROM departments WHERE id = ? LIMIT 1`,
    [departmentId]
  );
  return rows.length > 0;
}
