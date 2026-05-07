import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { checkPassword, hashPassword } from "@/lib/auth";

export async function getTenantById(tenantId: number): Promise<{ id: number; name: string; status: "active" | "inactive" } | null> {
  const [rows] = await pool.query<Array<RowDataPacket & { id: number; name: string; status: "active" | "inactive" }>>(
    `SELECT id, name, status
     FROM tenants
     WHERE id = ?
     LIMIT 1`,
    [tenantId]
  );

  return rows[0] || null;
}

export async function getAllTenants(): Promise<Array<{ id: number; name: string; status: "active" | "inactive"; created_at: Date; updated_at: Date }>> {
  const [rows] = await pool.query<Array<RowDataPacket & { id: number; name: string; status: "active" | "inactive"; created_at: Date; updated_at: Date }>>(
    `SELECT id, name, status, created_at, updated_at
     FROM tenants
     ORDER BY name ASC`
  );
  return rows;
}

type TenantMembership = RowDataPacket & {
  tenant_id: number;
  tenant_name: string;
  tenant_status: "active" | "inactive";
  employee_id: number;
  employee_status: "active" | "inactive";
  role_id: number;
  membership_status: "active" | "inactive";
  is_default: 0 | 1;
};

export async function getTenantMembershipsByGlobalUser(globalUserId: number) {
  const [rows] = await pool.query<TenantMembership[]>(
    `
      SELECT gut.tenant_id,
             t.name AS tenant_name,
             t.status AS tenant_status,
             gut.employee_id,
             e.status AS employee_status,
             e.role_id,
             gut.status AS membership_status,
             gut.is_default
      FROM global_users_tenants gut
      JOIN tenants t ON t.id = gut.tenant_id
      JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
      WHERE gut.global_user_id = ?
      ORDER BY gut.is_default DESC, t.name ASC
    `,
    [globalUserId]
  );

  return rows;
}

export async function getTenantMembershipByGlobalUserAndTenant(globalUserId: number, tenantId: number) {
  const [rows] = await pool.query<TenantMembership[]>(
    `
      SELECT gut.tenant_id,
             t.name AS tenant_name,
             t.status AS tenant_status,
             gut.employee_id,
             e.status AS employee_status,
             e.role_id,
             gut.status AS membership_status,
             gut.is_default
      FROM global_users_tenants gut
      JOIN tenants t ON t.id = gut.tenant_id
      JOIN employees e ON e.tenant_id = gut.tenant_id AND e.id = gut.employee_id
      WHERE gut.global_user_id = ? AND gut.tenant_id = ?
      LIMIT 1
    `,
    [globalUserId, tenantId]
  );

  return rows[0] || null;
}

type CreateTenantWithInitialAdminInput = {
  tenantName: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  departmentName?: string;
};

export async function createTenantWithInitialAdmin(input: CreateTenantWithInitialAdminInput) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [tenantResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO tenants (name, status) VALUES (?, 'active')`,
      [input.tenantName]
    );
    const tenantId = Number(tenantResult.insertId);

    const [roleResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO roles (tenant_id, role_name) VALUES (?, 'admin')`,
      [tenantId]
    );
    const roleId = Number(roleResult.insertId);

    const [departmentResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO departments (tenant_id, department_name) VALUES (?, ?)`,
      [tenantId, input.departmentName?.trim() || "Amministrazione"]
    );
    const departmentId = Number(departmentResult.insertId);

    const [employeeResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO employees (tenant_id, first_name, last_name, role_id, department_id, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [tenantId, input.adminFirstName, input.adminLastName, roleId, departmentId]
    );
    const employeeId = Number(employeeResult.insertId);

    const [globalRows] = await connection.query<Array<RowDataPacket & { id: number; password_hash: string; status: "active" | "inactive" }>>(
      `SELECT id, password_hash, status
       FROM global_users
       WHERE email = ?
       LIMIT 1`,
      [input.adminEmail]
    );

    let globalUserId: number;
    if (globalRows[0]) {
      const existingUser = globalRows[0];
      if (!checkPassword(input.adminPassword, existingUser.password_hash)) {
        throw Object.assign(new Error("Global user already exists with a different password"), { code: "PASSWORD_MISMATCH" });
      }
      if (existingUser.status !== "active") {
        throw Object.assign(new Error("Global user is inactive"), { code: "GLOBAL_USER_INACTIVE" });
      }
      globalUserId = Number(existingUser.id);
    } else {
      const [globalResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO global_users (email, password_hash, status) VALUES (?, ?, 'active')`,
        [input.adminEmail, hashPassword(input.adminPassword)]
      );
      globalUserId = Number(globalResult.insertId);
    }

    await connection.query(
      `INSERT INTO global_users_tenants (global_user_id, tenant_id, employee_id, status, is_default)
       VALUES (?, ?, ?, 'active', 1)`,
      [globalUserId, tenantId, employeeId]
    );

    await connection.query(
      `INSERT INTO role_permission (tenant_id, role_id, permission_id)
       SELECT ?, ?, id FROM permissions`,
      [tenantId, roleId]
    );

    await connection.commit();
    return { tenantId, roleId, departmentId, employeeId, globalUserId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

type GetTenantsOptions = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  sortBy?: 'name' | 'created_at' | 'id';
  sortOrder?: 'asc' | 'desc';
};

export async function getTenants(options: GetTenantsOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 15));
  const offset = (page - 1) * limit;
  const search = options.search?.trim() || '';
  const status = options.status || 'all';
  const sortBy = options.sortBy || 'created_at';
  const sortOrder = (options.sortOrder || 'desc').toUpperCase();

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (search) {
    whereClause += ' AND (t.name LIKE ? OR t.id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status !== 'all') {
    whereClause += ' AND t.status = ?';
    params.push(status);
  }

  const sortColumn = sortBy === 'id' ? 't.id' : sortBy === 'name' ? 't.name' : 't.created_at';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM tenants t WHERE ${whereClause}`;
  const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Get paginated results
  const query = `
    SELECT id, name, status, created_at, updated_at
    FROM tenants t
    WHERE ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query<Array<RowDataPacket & { id: number; name: string; status: "active" | "inactive"; created_at: Date; updated_at: Date }>>(
    query,
    [...params, limit, offset]
  );

  return {
    tenants: rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function deleteTenant(tenantId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM tenants WHERE id = ?`,
    [tenantId]
  );
  return result.affectedRows > 0;
}
