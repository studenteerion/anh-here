import pool from "@/lib/db";
import { CompanyReport, CompanyReportFilter } from "@/types/companyReports";

export async function getAllCompanyReports(
  tenantId: number,
  filters?: CompanyReportFilter
): Promise<CompanyReport[]> {
  let query = `SELECT id, employee_id, created_at, link FROM company_reports WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (filters?.employeeId) {
    query += ` AND employee_id = ?`;
    params.push(filters.employeeId);
  }

  query += ` ORDER BY created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getCompanyReportsCount(
  tenantId: number,
  filters?: { employeeId?: number }
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM company_reports WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (filters?.employeeId) {
    query += ` AND employee_id = ?`;
    params.push(filters.employeeId);
  }

  const [result]: any = await pool.query(query, params);
  return result[0]?.total || 0;
}

export async function getCompanyReportById(
  tenantId: number,
  reportId: number
): Promise<CompanyReport | null> {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, created_at, link FROM company_reports WHERE tenant_id = ? AND id = ?`,
    [tenantId, reportId]
  );
  return rows[0] || null;
}

export async function createCompanyReport(
  tenantId: number,
  employeeId: number,
  link: string
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO company_reports (tenant_id, employee_id, link, created_at)
     VALUES (?, ?, ?, NOW())`,
    [tenantId, employeeId, link]
  );
  return result.insertId;
}

export async function updateCompanyReport(
  tenantId: number,
  reportId: number,
  link: string
): Promise<boolean> {
  const [result]: any = await pool.query(
    `UPDATE company_reports SET link = ? WHERE tenant_id = ? AND id = ?`,
    [link, tenantId, reportId]
  );
  return result.affectedRows > 0;
}

export async function deleteCompanyReport(tenantId: number, reportId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `DELETE FROM company_reports WHERE tenant_id = ? AND id = ?`,
    [tenantId, reportId]
  );
  return result.affectedRows > 0;
}
