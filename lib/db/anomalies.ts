import pool from "@/lib/db";
import { Anomaly, AnomalyFilter } from "@/types/anomalies";

export async function getEmployeeAnomalies(
  tenantId: number,
  employeeId: number,
  filters?: AnomalyFilter
): Promise<Anomaly[]> {
  let query = `SELECT a.id, a.description, a.created_at, a.reporter_id, a.employee_Id as employee_id, a.resolver_id, a.status, a.resolution_notes, a.resolved_at,
      CONCAT(r.first_name, ' ', r.last_name) as reporter_name,
      CONCAT(res.first_name, ' ', res.last_name) as resolver_name
      FROM anomalies a
      LEFT JOIN employees r ON a.reporter_id = r.id AND a.tenant_id = r.tenant_id
      LEFT JOIN employees res ON a.resolver_id = res.id AND a.tenant_id = res.tenant_id
      WHERE a.tenant_id = ? AND a.employee_Id = ?`;

  const params: any[] = [tenantId, employeeId];

  if (filters?.status) {
    query += ` AND a.status = ?`;
    params.push(filters.status);
  }

  query += ` ORDER BY a.created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getEmployeeAnomaliesCount(
  tenantId: number,
  employeeId: number,
  filters?: { status?: Anomaly["status"] }
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM anomalies WHERE tenant_id = ? AND employee_Id = ?`;
  const params: any[] = [tenantId, employeeId];

  if (filters?.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  const [result]: any = await pool.query(query, params);
  return result[0]?.total || 0;
}

export async function createAnomaly(
  tenantId: number,
  reporterId: number,
  employeeId: number,
  description: string
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO anomalies (tenant_id, reporter_id, employee_Id, description, status, created_at)
     VALUES (?, ?, ?, ?, 'open', NOW())`,
    [tenantId, reporterId, employeeId, description]
  );
  return result.insertId;
}

export async function getAnomalyById(tenantId: number, anomalyId: number): Promise<Anomaly | null> {
  const [rows]: any = await pool.query(
    `SELECT id, description, created_at, reporter_id, employee_Id as employee_id, resolver_id, status, resolution_notes, resolved_at
     FROM anomalies 
     WHERE tenant_id = ? AND id = ?`,
    [tenantId, anomalyId]
  );
  return rows[0] || null;
}

export async function updateAnomaly(
  tenantId: number,
  anomalyId: number,
  updates: {
    description?: string;
    status?: "open" | "in_progress" | "closed";
  }
) {
  const setClauses = [];
  const values = [];

  if (updates.description) {
    setClauses.push("description = ?");
    values.push(updates.description);
  }
  if (updates.status) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }

  if (setClauses.length === 0) {
    return false;
  }

  values.push(tenantId, anomalyId);

  const [result]: any = await pool.query(
    `UPDATE anomalies SET ${setClauses.join(", ")} WHERE tenant_id = ? AND id = ?`,
    values
  );

  return result.affectedRows > 0;
}

export async function deleteAnomaly(tenantId: number, anomalyId: number) {
  const [result]: any = await pool.query(
    `DELETE FROM anomalies WHERE tenant_id = ? AND id = ?`,
    [tenantId, anomalyId]
  );

  return result.affectedRows > 0;
}
