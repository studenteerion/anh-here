import pool from "@/lib/db";
import { Employee, EmployeeFilter } from "@/types/employees";
import { countRows, getById, exists } from "./utils";
import { roleExists as checkRoleExists } from "./roles";
import { departmentExists as checkDepartmentExists } from "./departments";

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
  if (filters?.status) {
    return await countRows('employees', 'status = ?', [filters.status]);
  }
  return await countRows('employees');
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
  let whereClause = 'department_id = ?';
  const params: any[] = [departmentId];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  return await countRows('employees', whereClause, params);
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

/**
 * Check if a role exists by ID
 * Re-exported from roles.ts for backward compatibility
 */
export async function roleExists(roleId: number): Promise<boolean> {
  return await checkRoleExists(roleId);
}

/**
 * Check if a department exists by ID
 * Re-exported from departments.ts for backward compatibility
 */
export async function departmentExists(departmentId: number): Promise<boolean> {
  return await checkDepartmentExists(departmentId);
}
