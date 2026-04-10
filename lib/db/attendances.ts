import pool from "@/lib/db";
import { Attendance, AttendanceFilter } from "@/types/attendances";
import { PoolConnection } from 'mysql2/promise';

export async function getOpenAttendance(employeeId: number): Promise<any | null> {
  // Return open attendance and computed hours up to NOW()
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime,
      ROUND(TIMESTAMPDIFF(SECOND, start_datetime, NOW())/3600, 2) AS hours_open
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
 */
export async function createAttendanceWithConnection(
  employeeId: number,
  shiftId: number,
  startDatetime: Date,
  connection: PoolConnection
): Promise<number | null> {
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

  if (result.affectedRows === 0) return null;
  return result.insertId;
}

export async function getOpenAttendanceInTransaction(
  employeeId: number,
  connection: PoolConnection
): Promise<any | null> {
  const [rows]: any = await connection.query(
    `SELECT id, employee_id, shift_id, start_datetime,
      ROUND(TIMESTAMPDIFF(SECOND, start_datetime, NOW())/3600, 2) AS hours_open
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
  endDate: Date,
  filters?: AttendanceFilter
): Promise<any[]> {
  // Include computed hours for each attendance (NULL if still open)
  let query = `SELECT id, employee_id, shift_id, start_datetime, end_datetime,
      CASE WHEN end_datetime IS NOT NULL
        THEN ROUND(TIMESTAMPDIFF(SECOND, start_datetime, end_datetime)/3600, 2)
        ELSE NULL END AS hours
     FROM attendances
     WHERE employee_id = ?
     AND DATE(start_datetime) >= DATE(?)
     AND DATE(start_datetime) <= DATE(?)
     ORDER BY start_datetime DESC`;

  const params: any[] = [employeeId, startDate, endDate];

  // If filters.limit is provided and > 0, apply limit/offset. If limit is 0 or undefined -> return all
  if (filters?.limit && Number(filters.limit) > 0) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows as any[];
}

export async function getAttendanceHistoryCount(
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const [result]: any = await pool.query(
    `SELECT COUNT(*) as total FROM attendances 
     WHERE employee_id = ? 
     AND DATE(start_datetime) >= DATE(?) 
     AND DATE(start_datetime) <= DATE(?)`,
    [employeeId, startDate, endDate]
  );
  return result[0]?.total || 0;
}

export async function getTodayAttendance(employeeId: number): Promise<any[]> {
  // Return today's attendances and computed hours (for closed ones) or hours till now for open
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, shift_id, start_datetime, end_datetime,
      CASE
        WHEN end_datetime IS NOT NULL THEN ROUND(TIMESTAMPDIFF(SECOND, start_datetime, end_datetime)/3600, 2)
        ELSE ROUND(TIMESTAMPDIFF(SECOND, start_datetime, NOW())/3600, 2)
      END AS hours
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

/**
 * Calculate worked hours using the database (fallback to DB calculation)
 */
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
