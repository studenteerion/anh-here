import pool from "@/lib/db";
import { Department, DepartmentFilter } from "@/types/departments";
import { countRows, getById, getByField, insert, updateById, deleteById, exists } from "./utils";

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
  return await countRows('departments');
}

export async function getDepartmentById(departmentId: number): Promise<Department | null> {
  return await getById<Department>(
    'departments',
    departmentId,
    'id, department_name'
  );
}

export async function getDepartmentByName(departmentName: string): Promise<Department | null> {
  return await getByField<Department>(
    'departments',
    'department_name',
    departmentName,
    'id, department_name'
  );
}

export async function createDepartment(departmentName: string): Promise<number> {
  return await insert('departments', { department_name: departmentName });
}

export async function updateDepartment(departmentId: number, departmentName: string): Promise<boolean> {
  return await updateById('departments', departmentId, { department_name: departmentName });
}

export async function deleteDepartment(departmentId: number): Promise<boolean> {
  return await deleteById('departments', departmentId);
}

/**
 * Check if a department exists by ID
 * Used for FK validation in employee creation
 */
export async function departmentExists(departmentId: number): Promise<boolean> {
  return await exists('departments', departmentId);
}
