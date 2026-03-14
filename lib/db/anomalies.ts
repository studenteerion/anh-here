import pool from "@/lib/db";

export interface Anomaly {
  id: number;
  description: string;
  created_at: Date;
  reporter_id: number;
  resolver_id: number | null;
  status: "open" | "in_progress" | "closed";
  resolution_notes: string | null;
  resolved_at: Date | null;
}

export async function getEmployeeAnomalies(
  employeeId: number,
  filters?: {
    status?: 'open' | 'in_progress' | 'closed';
    limit?: number;
    offset?: number;
  }
): Promise<Anomaly[]> {
  let query = `SELECT id, description, created_at, reporter_id, resolver_id, status, resolution_notes, resolved_at
     FROM anomalies 
     WHERE reporter_id = ?`;
  
  const params: any[] = [employeeId];

  if (filters?.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  query += ` ORDER BY created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getEmployeeAnomaliesCount(
  employeeId: number,
  filters?: { status?: string }
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM anomalies WHERE reporter_id = ?`;
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
  description: string
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO anomalies (reporter_id, description, status, created_at)
     VALUES (?, ?, 'open', NOW())`,
    [reporterId, description]
  );
  return result.insertId;
}

export async function getAnomalyById(anomalyId: number): Promise<Anomaly | null> {
  const [rows]: any = await pool.query(
    `SELECT id, description, created_at, reporter_id, resolver_id, status, resolution_notes, resolved_at
     FROM anomalies 
     WHERE id = ?`,
    [anomalyId]
  );
  return rows[0] || null;
}

export async function getOpenAnomalies(limit: number = 100) {
  const [rows]: any = await pool.query(
    `SELECT id, description, created_at, reporter_id, resolver_id, status, resolution_notes, resolved_at
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
    `SELECT id, description, created_at, reporter_id, resolver_id, status, resolution_notes, resolved_at
     FROM anomalies 
     WHERE reporter_id = ? AND status = 'open'
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
