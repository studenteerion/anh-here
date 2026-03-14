import pool from "@/lib/db";
import { Timesheet, TimesheetFilter } from "@/types/timesheets";

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

export async function closeAttendance(
  attendanceId: number,
  endDatetime: Date
): Promise<void> {
  await pool.query(
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
