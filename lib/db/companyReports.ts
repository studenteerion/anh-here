import pool from "@/lib/db";
import { CompanyReport, CompanyReportFilter } from "@/types/companyReports";

export async function getAllCompanyReports(
  filters?: CompanyReportFilter
): Promise<CompanyReport[]> {
  let query = `SELECT id, employee_id, created_at, link FROM company_reports`;
  const params: any[] = [];

  if (filters?.employeeId) {
    query += ` WHERE employee_id = ?`;
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
  filters?: { employeeId?: number }
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM company_reports`;
  const params: any[] = [];

  if (filters?.employeeId) {
    query += ` WHERE employee_id = ?`;
    params.push(filters.employeeId);
  }

  const [result]: any = await pool.query(query, params);
  return result[0]?.total || 0;
}

export async function getCompanyReportById(
  reportId: number
): Promise<CompanyReport | null> {
  const [rows]: any = await pool.query(
    `SELECT id, employee_id, created_at, link FROM company_reports WHERE id = ?`,
    [reportId]
  );
  return rows[0] || null;
}

export async function getEmployeeReports(
  employeeId: number,
  filters?: CompanyReportFilter
): Promise<CompanyReport[]> {
  let query = `SELECT id, employee_id, created_at, link FROM company_reports WHERE employee_id = ?`;
  const params: any[] = [employeeId];

  query += ` ORDER BY created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, filters.offset || 0);
  }

  const [rows]: any = await pool.query(query, params);
  return rows;
}

export async function getEmployeeReportsCount(
  employeeId: number
): Promise<number> {
  const [result]: any = await pool.query(
    `SELECT COUNT(*) as total FROM company_reports WHERE employee_id = ?`,
    [employeeId]
  );
  return result[0]?.total || 0;
}

export async function createCompanyReport(
  employeeId: number,
  link: string
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO company_reports (employee_id, link, created_at)
     VALUES (?, ?, NOW())`,
    [employeeId, link]
  );
  return result.insertId;
}

export async function updateCompanyReport(
  reportId: number,
  link: string
): Promise<boolean> {
  const [result]: any = await pool.query(
    `UPDATE company_reports SET link = ? WHERE id = ?`,
    [link, reportId]
  );
  return result.affectedRows > 0;
}

export async function deleteCompanyReport(reportId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `DELETE FROM company_reports WHERE id = ?`,
    [reportId]
  );
  return result.affectedRows > 0;
}

export async function deleteEmployeeReports(employeeId: number): Promise<boolean> {
  const [result]: any = await pool.query(
    `DELETE FROM company_reports WHERE employee_id = ?`,
    [employeeId]
  );
  return result.affectedRows > 0;
}
