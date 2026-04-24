import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * BROKEN VERSION - Race condition vulnerable
 * This version checks and inserts in separate operations
 * Multiple concurrent calls can pass the check simultaneously
 * and create duplicate attendances
 */

type OpenAttendanceRow = RowDataPacket & {
  id: number;
  employee_id: number;
  shift_id: number | null;
  start_datetime: string;
};

export async function getOpenAttendanceBroken(tenantId: number, employeeId: number): Promise<OpenAttendanceRow | null> {
  const [rows] = await pool.query<OpenAttendanceRow[]>(
    `SELECT id, employee_id, shift_id, start_datetime 
     FROM attendances 
     WHERE tenant_id = ? AND employee_id = ? AND end_datetime IS NULL 
     ORDER BY start_datetime DESC LIMIT 1`,
    [tenantId, employeeId]
  );
  return rows[0] || null;
}

export async function createAttendanceBroken(
  tenantId: number,
  employeeId: number,
  shiftId: number,
  startDatetime: Date
): Promise<number> {
  // RACE CONDITION HERE: No atomic check
  // If called twice simultaneously, both can succeed
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO attendances (tenant_id, employee_id, shift_id, start_datetime) 
     VALUES (?, ?, ?, ?)`,
    [tenantId, employeeId, shiftId, startDatetime]
  );
  return result.insertId;
}

export async function closeAttendanceBroken(
  tenantId: number,
  attendanceId: number,
  endDatetime: Date
): Promise<void> {
  await pool.query(
    `UPDATE attendances SET end_datetime = ? WHERE tenant_id = ? AND id = ?`,
    [endDatetime, tenantId, attendanceId]
  );
}
