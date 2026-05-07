/* eslint-disable @typescript-eslint/no-explicit-any */

import pool from "@/lib/db";
import { AttendanceFilter } from "@/types/attendances";
import { PoolConnection } from "mysql2/promise";

export type AttendanceRow = {
  id: number;
  employee_id: number;
  shift_id: number;
  start_datetime: string;
  end_datetime?: string | null;
  hours_open?: number;
};

export type Shift = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
};

export type TodayAttendance = {
  id: number;
  employee_id: number;
  shift_id: number;
  start_datetime: string;
  end_datetime?: string | null;
  hours?: number | null;
};

export type AttendanceHistoryRow = {
  id: number;
  employee_id: number;
  shift_id: number;
  start_datetime: string;
  end_datetime?: string | null;
  hours?: number | null;
};

export async function getOpenAttendance(tenantId: number, employeeId: number): Promise<AttendanceRow | null> {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime,
      ROUND(TIMESTAMPDIFF(SECOND, start_datetime, NOW())/3600, 2) AS hours_open
     FROM attendances
     WHERE tenant_id = ? AND employee_id = ? AND end_datetime IS NULL
     ORDER BY start_datetime DESC LIMIT 1`,
    [tenantId, employeeId]
  );
  const rowsAny = rows as any[];
  return (rowsAny[0] || null) as AttendanceRow | null;
}

export async function createAttendance(
  tenantId: number,
  employeeId: number,
  shiftId: number,
  startDatetime: Date
): Promise<number> {
  const [result]: any = await pool.query(
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
  const [result]: any = await connection.query(
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
): Promise<AttendanceRow | null> {
  const [rows]: any = await connection.query(
    `SELECT id, employee_id, shift_id, start_datetime,
      ROUND(TIMESTAMPDIFF(SECOND, start_datetime, NOW())/3600, 2) AS hours_open
     FROM attendances
     WHERE tenant_id = ? AND employee_id = ? AND end_datetime IS NULL
     ORDER BY start_datetime DESC LIMIT 1
     FOR UPDATE`,
    [tenantId, employeeId]
  );
  const rowsAny = rows as any[];
  return (rowsAny[0] || null) as AttendanceRow | null;
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
): Promise<AttendanceHistoryRow[]> {
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

  const [rows]: any = await pool.query(query, params);
  return rows as AttendanceHistoryRow[];
}

export async function getAttendanceHistoryCount(
  tenantId: number,
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const [result]: any = await pool.query(
    `SELECT COUNT(*) as total FROM attendances 
     WHERE tenant_id = ?
     AND employee_id = ? 
     AND DATE(start_datetime) >= DATE(?) 
     AND DATE(start_datetime) <= DATE(?)`,
    [tenantId, employeeId, startDate, endDate]
  );
  return result[0]?.total || 0;
}

export async function getTodayAttendance(tenantId: number, employeeId: number): Promise<TodayAttendance[]> {
  const [rows]: any = await pool.query(
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
  return rows as TodayAttendance[];
}

export async function getEmployeeShift(tenantId: number, employeeId: number): Promise<Shift | null> {
  const [rows]: any = await pool.query(
    `SELECT s.id, s.name, s.start_time, s.end_time 
     FROM shifts s
     JOIN employees e ON e.department_id = s.department_id AND e.tenant_id = s.tenant_id
     WHERE e.tenant_id = ? AND e.id = ? LIMIT 1`,
    [tenantId, employeeId]
  );
  const rowsAny = rows as any[];
  return (rowsAny[0] || null) as Shift | null;
}

export async function calculateWorkedHours(
  startDatetime: Date,
  endDatetime: Date
): Promise<number> {
  const [rows]: any = await pool.query(
    `SELECT ROUND((UNIX_TIMESTAMP(?) - UNIX_TIMESTAMP(?))/3600, 2) AS hours`,
    [endDatetime, startDatetime]
  );
  return rows[0]?.hours || 0;
}
