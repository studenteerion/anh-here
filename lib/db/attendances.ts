import pool from "@/lib/db";
import { AttendanceFilter } from "@/types/attendances";
import { PoolConnection } from "mysql2/promise";

export async function getOpenAttendance(tenantId: number, employeeId: number): Promise<unknown | null> {
  const [rows]: unknown = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime,
      ROUND(TIMESTAMPDIFF(SECOND, start_datetime, NOW())/3600, 2) AS hours_open
     FROM attendances
     WHERE tenant_id = ? AND employee_id = ? AND end_datetime IS NULL
     ORDER BY start_datetime DESC LIMIT 1`,
    [tenantId, employeeId]
  );
  return rows[0] || null;
}

export async function createAttendance(
  tenantId: number,
  employeeId: number,
  shiftId: number,
  startDatetime: Date
): Promise<number> {
  const [result]: unknown = await pool.query(
    `INSERT INTO attendances (tenant_id, employee_id, shift_id, start_datetime) 
     VALUES (?, ?, ?, ?)`,
    [tenantId, employeeId, shiftId, startDatetime]
  );
  return result.insertId;
}

export async function createAttendanceWithConnection(
  tenantId: number,
  employeeId: number,
  shiftId: number,
  startDatetime: Date,
  connection: PoolConnection
): Promise<number | null> {
  const [result]: unknown = await connection.query(
    `INSERT INTO attendances (tenant_id, employee_id, shift_id, start_datetime)
     SELECT ?, ?, ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM attendances 
       WHERE tenant_id = ? AND employee_id = ? 
       AND end_datetime IS NULL
     )`,
    [tenantId, employeeId, shiftId, startDatetime, tenantId, employeeId]
  );

  if (result.affectedRows === 0) return null;
  return result.insertId;
}

export async function getOpenAttendanceInTransaction(
  tenantId: number,
  employeeId: number,
  connection: PoolConnection
): Promise<unknown | null> {
  const [rows]: unknown = await connection.query(
    `SELECT id, employee_id, shift_id, start_datetime,
      ROUND(TIMESTAMPDIFF(SECOND, start_datetime, NOW())/3600, 2) AS hours_open
     FROM attendances
     WHERE tenant_id = ? AND employee_id = ? AND end_datetime IS NULL
     ORDER BY start_datetime DESC LIMIT 1
     FOR UPDATE`,
    [tenantId, employeeId]
  );
  return rows[0] || null;
}

export async function closeAttendance(
  tenantId: number,
  attendanceId: number,
  endDatetime: Date
): Promise<void> {
  await pool.query(
    `UPDATE attendances SET end_datetime = ? WHERE tenant_id = ? AND id = ?`,
    [endDatetime, tenantId, attendanceId]
  );
}

export async function closeAttendanceWithConnection(
  tenantId: number,
  attendanceId: number,
  endDatetime: Date,
  connection: PoolConnection
): Promise<void> {
  await connection.query(
    `UPDATE attendances SET end_datetime = ? WHERE tenant_id = ? AND id = ?`,
    [endDatetime, tenantId, attendanceId]
  );
}

export async function getAttendanceHistory(
  tenantId: number,
  employeeId: number,
  startDate: Date,
  endDate: Date,
  filters?: AttendanceFilter
): Promise<unknown[]> {
  let query = `SELECT id, employee_id, shift_id, start_datetime, end_datetime,
      CASE WHEN end_datetime IS NOT NULL
        THEN ROUND(TIMESTAMPDIFF(SECOND, start_datetime, end_datetime)/3600, 2)
        ELSE NULL END AS hours
     FROM attendances
     WHERE tenant_id = ?
     AND employee_id = ?
     AND DATE(start_datetime) >= DATE(?)
     AND DATE(start_datetime) <= DATE(?)
     ORDER BY start_datetime DESC`;

  const params: unknown[] = [tenantId, employeeId, startDate, endDate];

  if (filters?.limit && Number(filters.limit) > 0) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: unknown = await pool.query(query, params);
  return rows as unknown[];
}

export async function getAttendanceHistoryCount(
  tenantId: number,
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const [result]: unknown = await pool.query(
    `SELECT COUNT(*) as total FROM attendances 
     WHERE tenant_id = ?
     AND employee_id = ? 
     AND DATE(start_datetime) >= DATE(?) 
     AND DATE(start_datetime) <= DATE(?)`,
    [tenantId, employeeId, startDate, endDate]
  );
  return result[0]?.total || 0;
}

export async function getTodayAttendance(tenantId: number, employeeId: number): Promise<unknown[]> {
  const [rows]: unknown = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime, end_datetime,
      CASE
        WHEN end_datetime IS NOT NULL THEN ROUND(TIMESTAMPDIFF(SECOND, start_datetime, end_datetime)/3600, 2)
        ELSE ROUND(TIMESTAMPDIFF(SECOND, start_datetime, NOW())/3600, 2)
      END AS hours
     FROM attendances
     WHERE tenant_id = ? AND employee_id = ? AND DATE(start_datetime) = CURDATE()
     ORDER BY start_datetime DESC`,
    [tenantId, employeeId]
  );
  return rows as unknown[];
}

export async function getEmployeeShift(tenantId: number, employeeId: number): Promise<unknown | null> {
  const [rows]: unknown = await pool.query(
    `SELECT s.id, s.name, s.start_time, s.end_time 
     FROM shifts s
     JOIN employees e ON e.department_id = s.department_id AND e.tenant_id = s.tenant_id
     WHERE e.tenant_id = ? AND e.id = ? LIMIT 1`,
    [tenantId, employeeId]
  );
  return (rows[0] || null) as unknown | null;
}

export async function calculateWorkedHours(
  startDatetime: Date,
  endDatetime: Date
): Promise<number> {
  const [rows]: unknown = await pool.query(
    `SELECT ROUND((UNIX_TIMESTAMP(?) - UNIX_TIMESTAMP(?))/3600, 2) AS hours`,
    [endDatetime, startDatetime]
  );
  return rows[0]?.hours || 0;
}
