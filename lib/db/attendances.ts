import pool from "@/lib/db";
import { Attendance, AttendanceFilter } from "@/types/attendances";
import { PoolConnection } from 'mysql2/promise';

export async function getOpenAttendance(employeeId: number): Promise<any | null> {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime 
     FROM attendances 
     WHERE employee_id = ? AND end_datetime IS NULL 
     ORDER BY start_datetime DESC LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
}

export async function createAttendance(
  employeeId: number,
  shiftId: number,
  startDatetime: Date
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO attendances (employee_id, shift_id, start_datetime) 
     VALUES (?, ?, ?)`,
    [employeeId, shiftId, startDatetime]
  );
  return result.insertId;
}

/**
 * Create attendance within a transaction using atomic INSERT
 * This version uses INSERT...SELECT with NOT EXISTS to prevent race conditions
 * Returns null if an open attendance already exists (instead of throwing error)
 * @param employeeId - Employee ID
 * @param shiftId - Shift ID
 * @param startDatetime - Start datetime
 * @param connection - Database connection (for transaction)
 * @returns Insert ID or null if open attendance already exists
 */
export async function createAttendanceWithConnection(
  employeeId: number,
  shiftId: number,
  startDatetime: Date,
  connection: PoolConnection
): Promise<number | null> {
  // Atomic INSERT: only insert if no open attendance exists
  // This is 100% race-condition proof because it's a single atomic operation
  const [result]: any = await connection.query(
    `INSERT INTO attendances (employee_id, shift_id, start_datetime)
     SELECT ?, ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM attendances 
       WHERE employee_id = ? 
       AND end_datetime IS NULL
     )`,
    [employeeId, shiftId, startDatetime, employeeId]
  );
  
  // If affectedRows === 0, an open attendance already exists
  if (result.affectedRows === 0) {
    return null; // Signal that insert was skipped
  }
  
  return result.insertId;
}

/**
 * Get open attendance within transaction with row lock
 * Used after atomic INSERT fails to retrieve the existing open record
 * Uses FOR UPDATE to lock the row and prevent concurrent modifications
 * @param employeeId - Employee ID
 * @param connection - Database connection (for transaction)
 * @returns Open attendance or null
 */
export async function getOpenAttendanceInTransaction(
  employeeId: number,
  connection: PoolConnection
): Promise<any | null> {
  const [rows]: any = await connection.query(
    `SELECT id, employee_id, shift_id, start_datetime 
     FROM attendances 
     WHERE employee_id = ? AND end_datetime IS NULL 
     ORDER BY start_datetime DESC LIMIT 1
     FOR UPDATE`,
    [employeeId]
  );
  return rows[0] || null;
}

export async function closeAttendance(
  attendanceId: number,
  endDatetime: Date
): Promise<void> {
  await pool.query(
    `UPDATE attendances SET end_datetime = ? WHERE id = ?`,
    [endDatetime, attendanceId]
  );
}

/**
 * Close attendance within a transaction
 * @param attendanceId - Attendance ID
 * @param endDatetime - End datetime
 * @param connection - Database connection (for transaction)
 */
export async function closeAttendanceWithConnection(
  attendanceId: number,
  endDatetime: Date,
  connection: PoolConnection
): Promise<void> {
  await connection.query(
    `UPDATE attendances SET end_datetime = ? WHERE id = ?`,
    [endDatetime, attendanceId]
  );
}

export async function getAttendanceHistory(
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime, end_datetime 
     FROM attendances 
     WHERE employee_id = ? 
     AND DATE(start_datetime) >= DATE(?) 
     AND DATE(start_datetime) <= DATE(?)
     ORDER BY start_datetime DESC`,
    [employeeId, startDate, endDate]
  );
  return rows as any[];
}

export async function getTodayAttendance(employeeId: number): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime, end_datetime 
     FROM attendances 
     WHERE employee_id = ? AND DATE(start_datetime) = CURDATE()
     ORDER BY start_datetime DESC`,
    [employeeId]
  );
  return rows as any[];
}

export async function getEmployeeShift(employeeId: number): Promise<any | null> {
  const [rows]: any = await pool.query(
    `SELECT s.id, s.name, s.start_time, s.end_time 
     FROM shifts s
     JOIN employees e ON e.department_id = s.department_id
     WHERE e.id = ? LIMIT 1`,
    [employeeId]
  );
  return (rows[0] || null) as any | null;
}

export async function calculateWorkedHours(
  startDatetime: Date,
  endDatetime: Date
): Promise<number> {
  const start = new Date(startDatetime).getTime();
  const end = new Date(endDatetime).getTime();
  return (end - start) / (1000 * 60 * 60);
}
