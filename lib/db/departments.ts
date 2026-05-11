/* eslint-disable @typescript-eslint/no-explicit-any */

import pool from "@/lib/db";
import { Department, DepartmentFilter } from "@/types/departments";
import { getById, getByField, insert, updateById, deleteById } from "./utils";

export async function getAllDepartments(
  tenantId: number,
  filters?: DepartmentFilter
): Promise<Department[]> {
  let query = `SELECT id, department_name
    FROM departments
    WHERE tenant_id = ?`;
  
  const params: unknown[] = [tenantId];

  query += ` ORDER BY department_name ASC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows as Department[];
}

export async function getDepartmentById(tenantId: number, departmentId: number): Promise<Department | null> {
  return await getById<Department>(
    'departments',
    tenantId,
    departmentId,
    'id, department_name'
  );
}

export async function getDepartmentByName(tenantId: number, departmentName: string): Promise<Department | null> {
  return await getByField<Department>(
    'departments',
    tenantId,
    'department_name',
    departmentName,
    'id, department_name'
  );
}

export async function createDepartment(tenantId: number, departmentName: string): Promise<number> {
  return await insert('departments', { tenant_id: tenantId, department_name: departmentName });
}

export async function updateDepartment(tenantId: number, departmentId: number, departmentName: string): Promise<boolean> {
  return await updateById('departments', tenantId, departmentId, { department_name: departmentName });
}

export async function deleteDepartment(tenantId: number, departmentId: number): Promise<boolean> {
  return await deleteById('departments', tenantId, departmentId);
}
