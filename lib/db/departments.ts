import pool from "@/lib/db";
import { Department, DepartmentFilter } from "@/types/departments";

export async function getAllDepartments(
  filters?: DepartmentFilter
): Promise<Department[]> {
  let query = `SELECT id, department_name
    FROM departments`;
  
  const params: any[] = [];

  query += ` ORDER BY department_name ASC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows as Department[];
}

export async function getDepartmentsCount(): Promise<number> {
  const [result]: any = await pool.query("SELECT COUNT(*) as total FROM departments");
  return result[0]?.total || 0;
}

export async function getDepartmentById(departmentId: number): Promise<Department | null> {
  const [rows]: any = await pool.query(
    `SELECT id, department_name
     FROM departments WHERE id = ? LIMIT 1`,
    [departmentId]
  );
  return (rows[0] || null) as Department | null;
}

export async function getDepartmentByName(departmentName: string): Promise<Department | null> {
  const [rows]: any = await pool.query(
    `SELECT id, department_name
     FROM departments WHERE department_name = ? LIMIT 1`,
    [departmentName]
  );
  return (rows[0] || null) as Department | null;
}

export async function createDepartment(departmentName: string): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO departments (department_name)
     VALUES (?)`,
    [departmentName]
  );

  return result.insertId;
}

export async function updateDepartment(departmentId: number, departmentName: string): Promise<boolean> {
  const [result]: any = await pool.query(
    `UPDATE departments SET department_name = ? WHERE id = ?`,
    [departmentName, departmentId]
  );

  return result.affectedRows > 0;
}

export async function deleteDepartment(departmentId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `DELETE FROM departments WHERE id = ?`,
    [departmentId]
  );

  return result.affectedRows > 0;
}
