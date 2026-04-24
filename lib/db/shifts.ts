/* eslint-disable @typescript-eslint/no-explicit-any */

import pool from "@/lib/db";
import { Shift, ShiftFilter } from "@/types/shifts";
import { countRows } from "./utils";

export async function getAllShifts(
  tenantId: number,
  filters?: ShiftFilter
): Promise<Shift[]> {
  let query = `SELECT 
    id, 
    department_id, 
    name, 
    DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') as start_time,
    DATE_FORMAT(end_time, '%Y-%m-%d %H:%i:%s') as end_time
    FROM shifts
    WHERE tenant_id = ?`;

  const params: unknown[] = [tenantId];

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows as Shift[];
}

export async function getShiftsCount(tenantId: number): Promise<number> {
  return await countRows("shifts", tenantId);
}

export async function getShiftById(tenantId: number, shiftId: number): Promise<Shift | null> {
  const [rows]: any = await pool.query(
    `SELECT id, department_id, name, 
      DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') as start_time,
      DATE_FORMAT(end_time, '%Y-%m-%d %H:%i:%s') as end_time
     FROM shifts WHERE tenant_id = ? AND id = ? LIMIT 1`,
    [tenantId, shiftId]
  );
  return (rows[0] || null) as Shift | null;
}

export async function getShiftsByDepartment(tenantId: number, departmentId: number): Promise<Shift[]> {
  const [rows]: any = await pool.query(
    `SELECT id, department_id, name, 
      DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') as start_time,
      DATE_FORMAT(end_time, '%Y-%m-%d %H:%i:%s') as end_time
     FROM shifts WHERE tenant_id = ? AND department_id = ?
     ORDER BY name ASC`,
    [tenantId, departmentId]
  );
  return rows as Shift[];
}

export async function createShift(
  tenantId: number,
  departmentId: number,
  name: string | null,
  startTime: Date | string,
  endTime: Date | string
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO shifts (tenant_id, department_id, name, start_time, end_time)
     VALUES (?, ?, ?, ?, ?)`,
    [tenantId, departmentId, name, startTime, endTime]
  );

  return result.insertId;
}

export async function updateShift(
  tenantId: number,
  shiftId: number,
  updates: {
    name?: string;
    startTime?: Date | string;
    endTime?: Date | string;
    departmentId?: number;
  }
): Promise<boolean> {
  const setClauses = [];
  const values = [];

  if (updates.name) {
    setClauses.push("name = ?");
    values.push(updates.name);
  }
  if (updates.startTime) {
    setClauses.push("start_time = ?");
    values.push(updates.startTime);
  }
  if (updates.endTime) {
    setClauses.push("end_time = ?");
    values.push(updates.endTime);
  }
  if (updates.departmentId) {
    setClauses.push("department_id = ?");
    values.push(updates.departmentId);
  }

  if (setClauses.length === 0) {
    return false;
  }

  values.push(tenantId, shiftId);

  const [result]: any = await pool.query(
    `UPDATE shifts SET ${setClauses.join(", ")} WHERE tenant_id = ? AND id = ?`,
    values
  );

  return result.affectedRows > 0;
}

export async function deleteShift(tenantId: number, shiftId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `DELETE FROM shifts WHERE tenant_id = ? AND id = ?`,
    [tenantId, shiftId]
  );

  return result.affectedRows > 0;
}

export async function getShiftsByEmployee(tenantId: number, employeeId: number): Promise<Shift[]> {
  const [rows]: any = await pool.query(
    `SELECT s.id, s.department_id, s.name, 
      DATE_FORMAT(s.start_time, '%Y-%m-%d %H:%i:%s') as start_time,
      DATE_FORMAT(s.end_time, '%Y-%m-%d %H:%i:%s') as end_time
     FROM shifts s
     JOIN employees e ON s.department_id = e.department_id AND s.tenant_id = e.tenant_id
     WHERE e.tenant_id = ? AND e.id = ?
     ORDER BY s.name ASC`,
    [tenantId, employeeId]
  );
  return rows as Shift[];
}

export async function getEmployeesByShift(tenantId: number, shiftId: number): Promise<unknown[]> {
  const [rows]: any = await pool.query(
    `SELECT DISTINCT
      e.id,
      e.first_name,
      e.last_name,
      e.status,
      COUNT(a.id) as attendance_count
    FROM employees e
    INNER JOIN attendances a ON e.id = a.employee_id AND e.tenant_id = a.tenant_id
    WHERE a.tenant_id = ? AND a.shift_id = ?
    GROUP BY e.id, e.first_name, e.last_name, e.status
    ORDER BY e.first_name, e.last_name`,
    [tenantId, shiftId]
  );
  return rows || [];
}
