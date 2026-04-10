import pool from "@/lib/db";
import { Anomaly, AnomalyFilter } from "@/types/anomalies";

export async function getEmployeeAnomalies(
  employeeId: number,
  filters?: AnomalyFilter
): Promise<Anomaly[]> {
  let query = `SELECT a.id, a.description, a.created_at, a.reporter_id, a.resolver_id, a.status, a.resolution_notes, a.resolved_at,
      CONCAT(r.first_name, ' ', r.last_name) as reporter_name,
      CONCAT(res.first_name, ' ', res.last_name) as resolver_name
      FROM anomalies a
      LEFT JOIN employees r ON a.reporter_id = r.id
      LEFT JOIN employees res ON a.resolver_id = res.id
      WHERE a.reporter_id = ?`;
  
  const params: any[] = [employeeId];

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
  employeeId: number,
  filters?: { status?: Anomaly["status"] }
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM anomalies WHERE employee_id = ?`;
  const params: any[] = [employeeId];

  if (filters?.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  const [result]: any = await pool.query(query, params);
  return result[0]?.total || 0;
}

export async function createAnomaly(
  reporterId: number,
  employeeId: number,
  description: string
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO anomalies (reporter_id, employee_id, description, status, created_at)
     VALUES (?, ?, ?, 'open', NOW())`,
    [reporterId, employeeId, description]
  );
  return result.insertId;
}

export async function getAnomalyById(anomalyId: number): Promise<Anomaly | null> {
  const [rows]: any = await pool.query(
    `SELECT id, description, created_at, reporter_id, employee_id, resolver_id, status, resolution_notes, resolved_at
     FROM anomalies 
     WHERE id = ?`,
    [anomalyId]
  );
  return rows[0] || null;
}

export async function getOpenAnomalies(limit: number = 100) {
  const [rows]: any = await pool.query(
    `SELECT id, description, created_at, reporter_id, employee_id, resolver_id, status, resolution_notes, resolved_at
     FROM anomalies 
     WHERE status = 'open'
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

export async function getEmployeeOpenAnomalies(
  employeeId: number,
  limit: number = 100
) {
  const [rows]: any = await pool.query(
    `SELECT id, description, created_at, reporter_id, employee_id, resolver_id, status, resolution_notes, resolved_at
     FROM anomalies 
     WHERE employee_id = ? AND status = 'open'
     ORDER BY created_at DESC
     LIMIT ?`,
    [employeeId, limit]
  );
  return rows;
}

export async function closeAnomaly(
  anomalyId: number,
  resolverId: number,
  notes: string
) {
  await pool.query(
    `UPDATE anomalies 
     SET status = 'closed', resolver_id = ?, resolution_notes = ?, resolved_at = NOW()
     WHERE id = ?`,
    [resolverId, notes, anomalyId]
  );
}

export async function updateAnomaly(
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

  values.push(anomalyId);

  const [result]: any = await pool.query(
    `UPDATE anomalies SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
}

export async function deleteAnomaly(anomalyId: number) {
  const [result]: any = await pool.query(
    `DELETE FROM anomalies WHERE id = ?`,
    [anomalyId]
  );

  return result.affectedRows > 0;
}
