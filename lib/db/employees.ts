import pool from "@/lib/db";

export async function getAllEmployees(limit?: number, offset?: number) {
  const query = `
    SELECT id, first_name, last_name, role_id, department_id, status, created_at, updated_at
    FROM employees
    ORDER BY created_at DESC
    ${limit ? "LIMIT ? OFFSET ?" : ""}
  `;
  
  const params = limit ? [limit, offset || 0] : [];
  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getEmployeesCount() {
  const [result]: any = await pool.query("SELECT COUNT(*) as total FROM employees");
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

export async function getEmployeesByDepartment(departmentId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, first_name, last_name, role_id, department_id, status, created_at, updated_at
     FROM employees WHERE department_id = ?
     ORDER BY first_name ASC`,
    [departmentId]
  );
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
