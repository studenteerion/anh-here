import pool from "@/lib/db";

export async function getAllDepartments(limit?: number, offset?: number) {
  const query = `
    SELECT id, department_name
    FROM departments
    ORDER BY department_name ASC
    ${limit ? "LIMIT ? OFFSET ?" : ""}
  `;
  
  const params = limit ? [limit, offset || 0] : [];
  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getDepartmentById(departmentId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, department_name
     FROM departments WHERE id = ? LIMIT 1`,
    [departmentId]
  );
  return rows[0] || null;
}

export async function getDepartmentByName(departmentName: string) {
  const [rows]: any = await pool.query(
    `SELECT id, department_name
     FROM departments WHERE department_name = ? LIMIT 1`,
    [departmentName]
  );
  return rows[0] || null;
}

export async function createDepartment(departmentName: string) {
  const [result]: any = await pool.query(
    `INSERT INTO departments (department_name)
     VALUES (?)`,
    [departmentName]
  );

  return result.insertId;
}

export async function updateDepartment(departmentId: number, departmentName: string) {
  const [result]: any = await pool.query(
    `UPDATE departments SET department_name = ? WHERE id = ?`,
    [departmentName, departmentId]
  );

  return result.affectedRows > 0;
}

export async function deleteDepartment(departmentId: number) {
  const [result]: any = await pool.query(
    `DELETE FROM departments WHERE id = ?`,
    [departmentId]
  );

  return result.affectedRows > 0;
}
