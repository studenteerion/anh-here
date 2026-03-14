import pool from "@/lib/db";

export async function createLeaveRequest(
  employeeId: number,
  startDatetime: Date,
  endDatetime: Date,
  type: "sick" | "vacation" | "personal" | "other",
  motivation?: string,
  approver1Id?: number,
  approver2Id?: number
) {
  const [result]: any = await pool.query(
    `INSERT INTO leave_requests 
     (employee_id, start_datetime, end_datetime, type, motivation, approver1_id, approver2_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [employeeId, startDatetime, endDatetime, type, motivation || null, approver1Id || null, approver2Id || null]
  );
  return result.insertId;
}

export async function getUserLeaveRequests(employeeId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, request_date, start_datetime, end_datetime, 
            type, motivation, approver1_id, approver1_status, approver1_date,
            approver2_id, approver2_status, approver2_date, status
     FROM leave_requests 
     WHERE employee_id = ?
     ORDER BY request_date DESC`,
    [employeeId]
  );
  return rows;
}

export async function getLeaveRequestById(requestId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, request_date, start_datetime, end_datetime, 
            type, motivation, approver1_id, approver1_status, approver1_date,
            approver2_id, approver2_status, approver2_date, status
     FROM leave_requests 
     WHERE id = ?`,
    [requestId]
  );
  return rows[0] || null;
}

export async function getPendingLeaveRequests(approverId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, request_date, start_datetime, end_datetime, 
            type, motivation, approver1_id, approver1_status, approver1_date,
            approver2_id, approver2_status, approver2_date, status
     FROM leave_requests 
     WHERE (approver1_id = ? OR approver2_id = ?)
     AND ((approver1_id = ? AND approver1_status = 'pending') 
          OR (approver2_id = ? AND approver2_status = 'pending'))
     ORDER BY request_date DESC`,
    [approverId, approverId, approverId, approverId]
  );
  return rows;
}

export async function getLeaveRequestsByDateRange(
  employeeId: number,
  startDate: Date,
  endDate: Date
) {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, type, start_datetime, end_datetime, status
     FROM leave_requests 
     WHERE employee_id = ? 
     AND ((DATE(start_datetime) >= DATE(?) AND DATE(start_datetime) <= DATE(?))
          OR (DATE(end_datetime) >= DATE(?) AND DATE(end_datetime) <= DATE(?)))
     AND status = 'approved'
     ORDER BY start_datetime ASC`,
    [employeeId, startDate, endDate, startDate, endDate]
  );
  return rows;
}

export async function updateLeaveRequestApproval(
  requestId: number,
  approverId: number,
  approvalStatus: "approved" | "rejected"
) {
  const request = await getLeaveRequestById(requestId);
  if (!request) return false;

  if (request.approver1_id === approverId && request.approver1_status === 'pending') {
    const [result]: any = await pool.query(
      `UPDATE leave_requests 
       SET approver1_status = ?, approver1_date = NOW()
       WHERE id = ?`,
      [approvalStatus, requestId]
    );
    return result.affectedRows > 0;
  }

  if (request.approver2_id === approverId && request.approver2_status === 'pending') {
    const [result]: any = await pool.query(
      `UPDATE leave_requests 
       SET approver2_status = ?, approver2_date = NOW()
       WHERE id = ?`,
      [approvalStatus, requestId]
    );
    return result.affectedRows > 0;
  }

  return false;
}

export async function deleteLeaveRequest(requestId: number) {
  const request = await getLeaveRequestById(requestId);
  if (!request || request.status !== 'pending') {
    return false;
  }

  const [result]: any = await pool.query(
    `DELETE FROM leave_requests WHERE id = ?`,
    [requestId]
  );

  return result.affectedRows > 0;
}
