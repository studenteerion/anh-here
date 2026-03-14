import pool from "@/lib/db";

export async function getAllShifts(limit?: number, offset?: number) {
  const query = `
    SELECT id, department_id, name, start_time, end_time
    FROM shifts
    ORDER BY created_at DESC
    ${limit ? "LIMIT ? OFFSET ?" : ""}
  `;
  
  const params = limit ? [limit, offset || 0] : [];
  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getShiftById(shiftId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, department_id, name, start_time, end_time
     FROM shifts WHERE id = ? LIMIT 1`,
    [shiftId]
  );
  return rows[0] || null;
}

export async function getShiftsByDepartment(departmentId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, department_id, name, start_time, end_time
     FROM shifts WHERE department_id = ?
     ORDER BY name ASC`,
    [departmentId]
  );
  return rows;
}

export async function createShift(
  departmentId: number,
  name: string,
  startTime: Date,
  endTime: Date
) {
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
) {
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

export async function deleteShift(shiftId: number) {
  const [result]: any = await pool.query(
    `DELETE FROM shifts WHERE id = ?`,
    [shiftId]
  );

  return result.affectedRows > 0;
}
