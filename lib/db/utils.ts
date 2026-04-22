/**
 * Generic database utility functions
 * Reduces code duplication across database layer files
 * All functions use the connection pool from lib/db/index
 */

import pool from './index';

/**
 * Whitelist of valid table names to prevent SQL injection
 * Only these table names are allowed in dynamic queries
 */
const VALID_TABLES = [
  'employees',
  'departments',
  'roles',
  'shifts',
  'attendance',
  'leave_requests',
  'anomalies',
  'company_reports',
  'user_accounts',
  'permissions',
  'permission_exceptions',
  'role_permission'
] as const;

type ValidTable = typeof VALID_TABLES[number];

/**
 * Validates that a table name is in the whitelist
 * @param table - Table name to validate
 * @throws Error if table name is not whitelisted
 */
function validateTableName(table: string): asserts table is ValidTable {
  if (!VALID_TABLES.includes(table as ValidTable)) {
    throw new Error(`Invalid table name: ${table}. Table name must be whitelisted for security.`);
  }
}

/**
 * Generic count rows function
 * @param table - Table name to count rows from (must be whitelisted)
 * @param whereClause - Optional WHERE condition (without WHERE keyword)
 * @param params - Optional parameters for WHERE clause
 * @returns Total count of rows matching criteria
 */
export async function countRows(
  table: string,
  tenantId?: number,
  whereClause?: string,
  params: unknown[] = []
): Promise<number> {
  validateTableName(table);
  let query = `SELECT COUNT(*) as total FROM ${table}`;
  const hasTenant = tenantId !== undefined;
  if (hasTenant || whereClause) {
    query += " WHERE ";
    if (hasTenant) {
      query += "tenant_id = ?";
    }
    if (whereClause) {
      query += hasTenant ? ` AND ${whereClause}` : whereClause;
    }
  }
  const finalParams = hasTenant ? [tenantId, ...params] : params;
  const [result]: unknown = await pool.query(query, finalParams);
  return result[0]?.total || 0;
}

/**
 * Generic get by ID function
 * Returns a single row by primary key (id)
 * @param table - Table name (must be whitelisted)
 * @param id - Primary key value
 * @param selectFields - Optional fields to select (default: *)
 * @returns Row object or null if not found
 */
export async function getById<T = unknown>(
  table: string,
  tenantId: number,
  id: number,
  selectFields: string = '*'
): Promise<T | null> {
  validateTableName(table);
  const query = `SELECT ${selectFields} FROM ${table} WHERE tenant_id = ? AND id = ? LIMIT 1`;
  const [rows]: unknown = await pool.query(query, [tenantId, id]);
  return rows[0] || null;
}

/**
 * Generic get by field function
 * Returns a single row matching a field value
 * @param table - Table name (must be whitelisted)
 * @param field - Field name to match
 * @param value - Value to match
 * @param selectFields - Optional fields to select (default: *)
 * @returns Row object or null if not found
 */
export async function getByField<T = unknown>(
  table: string,
  tenantId: number,
  field: string,
  value: unknown,
  selectFields: string = '*'
): Promise<T | null> {
  validateTableName(table);
  const query = `SELECT ${selectFields} FROM ${table} WHERE tenant_id = ? AND ${field} = ? LIMIT 1`;
  const [rows]: unknown = await pool.query(query, [tenantId, value]);
  return rows[0] || null;
}

/**
 * Check if an entity exists by ID
 * @param table - Table name (must be whitelisted)
 * @param id - Primary key value
 * @returns true if entity exists, false otherwise
 */
export async function exists(table: string, tenantId: number, id: number): Promise<boolean> {
  validateTableName(table);
  const [rows]: unknown = await pool.query(
    `SELECT id FROM ${table} WHERE tenant_id = ? AND id = ? LIMIT 1`,
    [tenantId, id]
  );
  return rows.length > 0;
}

/**
 * Delete a row by ID
 * @param table - Table name (must be whitelisted)
 * @param id - Primary key value
 * @returns true if row was deleted, false otherwise
 */
export async function deleteById(table: string, tenantId: number, id: number): Promise<boolean> {
  validateTableName(table);
  const [result]: unknown = await pool.query(`DELETE FROM ${table} WHERE tenant_id = ? AND id = ?`, [
    tenantId,
    id,
  ]);
  return result.affectedRows > 0;
}

/**
 * Delete rows by custom WHERE condition
 * @param table - Table name (must be whitelisted)
 * @param whereClause - WHERE condition (without WHERE keyword)
 * @param params - Parameters for WHERE clause
 * @returns Number of rows deleted
 */
export async function deleteWhere(
  table: string,
  whereClause: string,
  params: unknown[] = []
): Promise<number> {
  validateTableName(table);
  const query = `DELETE FROM ${table} WHERE ${whereClause}`;
  const [result]: unknown = await pool.query(query, params);
  return result.affectedRows;
}

/**
 * Insert a single row
 * @param table - Table name (must be whitelisted)
 * @param fields - Object with field:value pairs
 * @returns Insert ID of new row
 */
export async function insert(
  table: string,
  fields: Record<string, unknown>
): Promise<number> {
  validateTableName(table);
  const keys = Object.keys(fields);
  const placeholders = keys.map(() => '?').join(',');
  const values = Object.values(fields);
  const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const [result]: unknown = await pool.query(query, values);
  return result.insertId;
}

/**
 * Update a row by ID with dynamic fields
 * @param table - Table name (must be whitelisted)
 * @param id - Primary key value
 * @param updates - Object with field:value pairs to update
 * @returns true if row was updated, false otherwise
 */
export async function updateById(
  table: string,
  tenantId: number,
  id: number,
  updates: Record<string, unknown>
): Promise<boolean> {
  validateTableName(table);
  if (Object.keys(updates).length === 0) {
    return false;
  }

  const setClauses = Object.keys(updates).map((key) => `${key} = ?`);
  const values = Object.values(updates);
  const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE tenant_id = ? AND id = ?`;
  values.push(tenantId, id);

  const [result]: unknown = await pool.query(query, values);
  return result.affectedRows > 0;
}

/**
 * Update rows by custom WHERE condition
 * @param table - Table name (must be whitelisted)
 * @param whereClause - WHERE condition (without WHERE keyword)
 * @param updates - Object with field:value pairs to update
 * @param whereParams - Parameters for WHERE clause
 * @returns Number of rows affected
 */
export async function updateWhere(
  table: string,
  whereClause: string,
  updates: Record<string, unknown>,
  whereParams: unknown[] = []
): Promise<number> {
  validateTableName(table);
  if (Object.keys(updates).length === 0) {
    return 0;
  }

  const setClauses = Object.keys(updates).map((key) => `${key} = ?`);
  const values = [...Object.values(updates), ...whereParams];
  const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClause}`;

  const [result]: unknown = await pool.query(query, values);
  return result.affectedRows;
}
