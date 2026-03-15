/**
 * Generic database utility functions
 * Reduces code duplication across database layer files
 * All functions use the connection pool from lib/db/index
 */

import pool from './index';

/**
 * Generic count rows function
 * @param table - Table name to count rows from
 * @param whereClause - Optional WHERE condition (without WHERE keyword)
 * @param params - Optional parameters for WHERE clause
 * @returns Total count of rows matching criteria
 */
export async function countRows(
  table: string,
  whereClause?: string,
  params: any[] = []
): Promise<number> {
  let query = `SELECT COUNT(*) as total FROM ${table}`;
  if (whereClause) {
    query += ` WHERE ${whereClause}`;
  }
  const [result]: any = await pool.query(query, params);
  return result[0]?.total || 0;
}

/**
 * Generic get by ID function
 * Returns a single row by primary key (id)
 * @param table - Table name
 * @param id - Primary key value
 * @param selectFields - Optional fields to select (default: *)
 * @returns Row object or null if not found
 */
export async function getById<T = any>(
  table: string,
  id: number,
  selectFields: string = '*'
): Promise<T | null> {
  const query = `SELECT ${selectFields} FROM ${table} WHERE id = ? LIMIT 1`;
  const [rows]: any = await pool.query(query, [id]);
  return rows[0] || null;
}

/**
 * Generic get by field function
 * Returns a single row matching a field value
 * @param table - Table name
 * @param field - Field name to match
 * @param value - Value to match
 * @param selectFields - Optional fields to select (default: *)
 * @returns Row object or null if not found
 */
export async function getByField<T = any>(
  table: string,
  field: string,
  value: any,
  selectFields: string = '*'
): Promise<T | null> {
  const query = `SELECT ${selectFields} FROM ${table} WHERE ${field} = ? LIMIT 1`;
  const [rows]: any = await pool.query(query, [value]);
  return rows[0] || null;
}

/**
 * Check if an entity exists by ID
 * @param table - Table name
 * @param id - Primary key value
 * @returns true if entity exists, false otherwise
 */
export async function exists(table: string, id: number): Promise<boolean> {
  const [rows]: any = await pool.query(
    `SELECT id FROM ${table} WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows.length > 0;
}

/**
 * Delete a row by ID
 * @param table - Table name
 * @param id - Primary key value
 * @returns true if row was deleted, false otherwise
 */
export async function deleteById(table: string, id: number): Promise<boolean> {
  const [result]: any = await pool.query(`DELETE FROM ${table} WHERE id = ?`, [
    id,
  ]);
  return result.affectedRows > 0;
}

/**
 * Delete rows by custom WHERE condition
 * @param table - Table name
 * @param whereClause - WHERE condition (without WHERE keyword)
 * @param params - Parameters for WHERE clause
 * @returns Number of rows deleted
 */
export async function deleteWhere(
  table: string,
  whereClause: string,
  params: any[] = []
): Promise<number> {
  const query = `DELETE FROM ${table} WHERE ${whereClause}`;
  const [result]: any = await pool.query(query, params);
  return result.affectedRows;
}

/**
 * Insert a single row
 * @param table - Table name
 * @param fields - Object with field:value pairs
 * @returns Insert ID of new row
 */
export async function insert(
  table: string,
  fields: Record<string, any>
): Promise<number> {
  const keys = Object.keys(fields);
  const placeholders = keys.map(() => '?').join(',');
  const values = Object.values(fields);
  const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const [result]: any = await pool.query(query, values);
  return result.insertId;
}

/**
 * Update a row by ID with dynamic fields
 * @param table - Table name
 * @param id - Primary key value
 * @param updates - Object with field:value pairs to update
 * @returns true if row was updated, false otherwise
 */
export async function updateById(
  table: string,
  id: number,
  updates: Record<string, any>
): Promise<boolean> {
  if (Object.keys(updates).length === 0) {
    return false;
  }

  const setClauses = Object.keys(updates).map((key) => `${key} = ?`);
  const values = Object.values(updates);
  const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ?`;
  values.push(id);

  const [result]: any = await pool.query(query, values);
  return result.affectedRows > 0;
}

/**
 * Update rows by custom WHERE condition
 * @param table - Table name
 * @param whereClause - WHERE condition (without WHERE keyword)
 * @param updates - Object with field:value pairs to update
 * @param whereParams - Parameters for WHERE clause
 * @returns Number of rows affected
 */
export async function updateWhere(
  table: string,
  whereClause: string,
  updates: Record<string, any>,
  whereParams: any[] = []
): Promise<number> {
  if (Object.keys(updates).length === 0) {
    return 0;
  }

  const setClauses = Object.keys(updates).map((key) => `${key} = ?`);
  const values = [...Object.values(updates), ...whereParams];
  const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClause}`;

  const [result]: any = await pool.query(query, values);
  return result.affectedRows;
}
