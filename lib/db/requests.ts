import pool from "@/lib/db";
import { LeaveRequest, LeaveRequestFilter } from "@/types/requests";

export async function createLeaveRequest(
  tenantId: number,
  employeeId: number,
  startDatetime: Date,
  endDatetime: Date,
  type: "sick" | "vacation" | "personal" | "other",
  motivation?: string,
  approver1Id?: number,
  approver2Id?: number
) {
  const [result]: unknown = await pool.query(
    `INSERT INTO leave_requests 
     (tenant_id, employee_id, start_datetime, end_datetime, type, motivation, approver1_id, approver2_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, employeeId, startDatetime, endDatetime, type, motivation || null, approver1Id || null, approver2Id || null]
  );
  return result.insertId;
}

export async function getUserLeaveRequests(
  tenantId: number,
  employeeId: number,
  filters?: LeaveRequestFilter
) {
  let query = `SELECT id, employee_id, request_date, start_datetime, end_datetime, 
            type, motivation, approver1_id, approver1_status, approver1_date,
            approver2_id, approver2_status, approver2_date, status
     FROM leave_requests 
     WHERE tenant_id = ? AND employee_id = ?`;

  const params: unknown[] = [tenantId, employeeId];

  if (filters?.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  query += ` ORDER BY request_date DESC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: unknown = await pool.query(query, params);
  return rows;
}

export async function getUserLeaveRequestsCount(
  tenantId: number,
  employeeId: number,
  filters?: { status?: LeaveRequest["status"] }
) {
  let query = `SELECT COUNT(*) as total FROM leave_requests WHERE tenant_id = ? AND employee_id = ?`;
  const params: unknown[] = [tenantId, employeeId];

  if (filters?.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  const [result]: unknown = await pool.query(query, params);
  return result[0]?.total || 0;
}

export async function getLeaveRequestById(tenantId: number, requestId: number) {
  const [rows]: unknown = await pool.query(
    `SELECT id, employee_id, request_date, start_datetime, end_datetime, 
            type, motivation, approver1_id, approver1_status, approver1_date,
            approver2_id, approver2_status, approver2_date, status
     FROM leave_requests 
     WHERE tenant_id = ? AND id = ?`,
    [tenantId, requestId]
  );
  return rows[0] || null;
}

export async function getLeaveRequestsByDateRange(
  tenantId: number,
  employeeId: number,
  startDate: Date,
  endDate: Date
) {
  const [rows]: unknown = await pool.query(
    `SELECT id, employee_id, type, start_datetime, end_datetime, status
     FROM leave_requests 
     WHERE tenant_id = ? AND employee_id = ? 
     AND ((DATE(start_datetime) >= DATE(?) AND DATE(start_datetime) <= DATE(?))
          OR (DATE(end_datetime) >= DATE(?) AND DATE(end_datetime) <= DATE(?)))
     AND status = 'approved'
     ORDER BY start_datetime ASC`,
    [tenantId, employeeId, startDate, endDate, startDate, endDate]
  );
  return rows;
}

function calculateLeaveRequestStatus(
  approver1_status: string | null,
  approver2_status: string | null
): "pending" | "approved" | "rejected" {
  if (approver1_status === "rejected" || approver2_status === "rejected") {
    return "rejected";
  }

  if (approver1_status === "approved" && approver2_status === "approved") {
    return "approved";
  }

  return "pending";
}

export async function assignAndUpdateApproval(
  tenantId: number,
  requestId: number,
  approverId: number,
  approvalStatus: "pending" | "approved" | "rejected"
) {
  const request = await getLeaveRequestById(tenantId, requestId);
  if (!request) return { success: false, error: "Request not found" };

  const startDate = new Date(request.start_datetime);
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  if (startDate <= oneDayFromNow) {
    return {
      success: false,
      error: "Cannot modify approval less than 1 day before leave start date"
    };
  }

  let updateQuery = "";
  let params: unknown[] = [];
  let newApprover1Status = request.approver1_status;
  let newApprover2Status = request.approver2_status;

  if (!request.approver1_id) {
    updateQuery = `UPDATE leave_requests 
                   SET approver1_id = ?, approver1_status = ?, approver1_date = NOW()
                   WHERE tenant_id = ? AND id = ?`;
    params = [approverId, approvalStatus, tenantId, requestId];
    newApprover1Status = approvalStatus;
  } else if (!request.approver2_id) {
    updateQuery = `UPDATE leave_requests 
                   SET approver2_id = ?, approver2_status = ?, approver2_date = NOW()
                   WHERE tenant_id = ? AND id = ?`;
    params = [approverId, approvalStatus, tenantId, requestId];
    newApprover2Status = approvalStatus;
  } else if (request.approver1_id === approverId) {
    updateQuery = `UPDATE leave_requests 
                   SET approver1_status = ?, approver1_date = NOW()
                   WHERE tenant_id = ? AND id = ?`;
    params = [approvalStatus, tenantId, requestId];
    newApprover1Status = approvalStatus;
  } else if (request.approver2_id === approverId) {
    updateQuery = `UPDATE leave_requests 
                   SET approver2_status = ?, approver2_date = NOW()
                   WHERE tenant_id = ? AND id = ?`;
    params = [approvalStatus, tenantId, requestId];
    newApprover2Status = approvalStatus;
  } else {
    return {
      success: false,
      error: "This leave request already has two approvers assigned"
    };
  }

  try {
    const [result]: unknown = await pool.query(updateQuery, params);

    if (result.affectedRows > 0) {
      const newStatus = calculateLeaveRequestStatus(newApprover1Status, newApprover2Status);
      await pool.query(
        `UPDATE leave_requests SET status = ? WHERE tenant_id = ? AND id = ?`,
        [newStatus, tenantId, requestId]
      );
    }

    return {
      success: result.affectedRows > 0,
      request: await getLeaveRequestById(tenantId, requestId)
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error.message || "Failed to update approval"
    };
  }
}

export async function deleteLeaveRequest(tenantId: number, requestId: number) {
  const request = await getLeaveRequestById(tenantId, requestId);
  if (!request || request.status !== "pending") {
    return false;
  }

  const [result]: unknown = await pool.query(
    `DELETE FROM leave_requests WHERE tenant_id = ? AND id = ?`,
    [tenantId, requestId]
  );

  return result.affectedRows > 0;
}
