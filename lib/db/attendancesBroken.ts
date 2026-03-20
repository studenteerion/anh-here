import pool from "@/lib/db";
import { PoolConnection } from 'mysql2/promise';

/**
 * BROKEN VERSION - Race condition vulnerable
 * This version checks and inserts in separate operations
 * Multiple concurrent calls can pass the check simultaneously
 * and create duplicate attendances
 */

export async function getOpenAttendanceBroken(employeeId: number): Promise<any | null> {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime 
     FROM attendances 
     WHERE employee_id = ? AND end_datetime IS NULL 
     ORDER BY start_datetime DESC LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
}

export async function createAttendanceBroken(
  employeeId: number,
  shiftId: number,
  startDatetime: Date
): Promise<number> {
  // RACE CONDITION HERE: No atomic check
  // If called twice simultaneously, both can succeed
  const [result]: any = await pool.query(
    `INSERT INTO attendances (employee_id, shift_id, start_datetime) 
     VALUES (?, ?, ?)`,
    [employeeId, shiftId, startDatetime]
  );
  return result.insertId;
}

export async function closeAttendanceBroken(
  attendanceId: number,
  endDatetime: Date
): Promise<void> {
  await pool.query(
    `UPDATE attendances SET end_datetime = ? WHERE id = ?`,
    [endDatetime, attendanceId]
  );
}
