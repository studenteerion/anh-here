import pool from "@/lib/db";
import { Shift, ShiftFilter } from "@/types/shifts";
import { countRows } from "./utils";

export async function getAllShifts(
  filters?: ShiftFilter
): Promise<Shift[]> {
  let query = `SELECT id, department_id, name, start_time, end_time
    FROM shifts`;
  
  const params: any[] = [];

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows as Shift[];
}

export async function getShiftsCount(): Promise<number> {
  return await countRows('shifts');
}

export async function getShiftById(shiftId: number): Promise<Shift | null> {
  const [rows]: any = await pool.query(
    `SELECT id, department_id, name, start_time, end_time
     FROM shifts WHERE id = ? LIMIT 1`,
    [shiftId]
  );
  return (rows[0] || null) as Shift | null;
}

export async function getShiftsByDepartment(departmentId: number): Promise<Shift[]> {
  const [rows]: any = await pool.query(
    `SELECT id, department_id, name, start_time, end_time
     FROM shifts WHERE department_id = ?
     ORDER BY name ASC`,
    [departmentId]
  );
  return rows as Shift[];
}

export async function createShift(
  departmentId: number,
  name: string,
  startTime: Date,
  endTime: Date
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO shifts (department_id, name, start_time, end_time)
     VALUES (?, ?, ?, ?)`,
    [departmentId, name, startTime, endTime]
  );

  return result.insertId;
}

export async function updateShift(
  shiftId: number,
  updates: {
    name?: string;
    startTime?: Date;
    endTime?: Date;
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

  values.push(shiftId);

  const [result]: any = await pool.query(
    `UPDATE shifts SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
}

export async function deleteShift(shiftId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `DELETE FROM shifts WHERE id = ?`,
    [shiftId]
  );

  return result.affectedRows > 0;
}

export async function getShiftsByEmployee(employeeId: number): Promise<Shift[]> {
  const [rows]: any = await pool.query(
    `SELECT s.id, s.department_id, s.name, s.start_time, s.end_time
     FROM shifts s
     JOIN employees e ON s.department_id = e.department_id
     WHERE e.id = ?
     ORDER BY s.name ASC`,
    [employeeId]
  );
  return rows as Shift[];
}

export async function getEmployeesByShift(shiftId: number): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT DISTINCT
      e.id,
      e.first_name,
      e.last_name,
      e.status,
      COUNT(a.id) as attendance_count
    FROM employees e
    INNER JOIN attendances a ON e.id = a.employee_id
    WHERE a.shift_id = ?
    GROUP BY e.id, e.first_name, e.last_name, e.status
    ORDER BY e.first_name, e.last_name`,
    [shiftId]
  );
  return rows || [];
}
