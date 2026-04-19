import pool from "@/lib/db";
import { Permission, PermissionException, RolePermission, PermissionFilter } from "@/types/permissions";

export async function checkUserPermission(
  tenantId: number,
  employeeId: number,
  permissionCode: string
): Promise<boolean> {
  try {
    // Prima controlla le eccezioni dell'utente
    const [exceptions]: any = await pool.query(
      `SELECT pe.is_allowed 
       FROM permission_exceptions pe
        JOIN permissions p ON pe.permission_id = p.id
       WHERE pe.tenant_id = ? AND pe.employee_id = ? AND p.permission_code = ?
       LIMIT 1`,
      [tenantId, employeeId, permissionCode]
    );

    // Se c'è un'eccezione, usa quella
    if (exceptions.length > 0) {
      return exceptions[0].is_allowed === 1;
    }

    // Altrimenti controlla i permessi del ruolo
    const [permissions]: any = await pool.query(
      `SELECT rp.permission_id
       FROM employees e
       JOIN role_permission rp ON e.role_id = rp.role_id AND e.tenant_id = rp.tenant_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE e.tenant_id = ? AND e.id = ? AND p.permission_code = ?
       LIMIT 1`,
      [tenantId, employeeId, permissionCode]
    );

    return permissions.length > 0;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

export async function getUserPermissionsById(tenantId: number, user_id: number): Promise<Permission[]> {
  // Costruisce i permessi dal ruolo dell'utente, escludendo eventuali negazioni esplicite,
  // poi include eventuali permessi esplicitamente consentiti in permission_exceptions.
  const [rows]: any = await pool.query(
    `
      (
        SELECT p.id, p.permission_code, p.description
        FROM permissions p
                 JOIN role_permission rp ON p.id = rp.permission_id AND rp.tenant_id = ?
                 JOIN employees e ON e.role_id = rp.role_id AND e.tenant_id = rp.tenant_id
        WHERE e.tenant_id = ? AND e.id = ?
          AND p.id NOT IN (
            SELECT pe.permission_id
            FROM permission_exceptions pe
            WHERE pe.tenant_id = ? AND pe.employee_id = ? AND pe.is_allowed = 0
          )
      )
      UNION
      (
        SELECT p.id, p.permission_code, p.description
        FROM permissions p
                 JOIN permission_exceptions pe ON p.id = pe.permission_id
        WHERE pe.tenant_id = ? AND pe.employee_id = ? AND pe.is_allowed = 1
      )
      ORDER BY permission_code
    `,
    [tenantId, tenantId, user_id, tenantId, user_id, tenantId, user_id]
  );

  return (rows || []) as Permission[];
}

export async function getAllPermissions(): Promise<Permission[]> {
  const [rows]: any = await pool.query(
    `
      SELECT id, permission_code, description
      FROM permissions
      ORDER BY permission_code
    `
  );
  return (rows || []) as Permission[];
}

export async function addPermissionToUser(tenantId: number, user_id: number, permission_id: number, isAllowed: number): Promise<boolean> {
  // Usa permission_exceptions per memorizzare override per dipendente (is_allowed = 0/1).
  // Inserisce o aggiorna l'eccezione. Se il progetto preferisce cancellare per i dinieghi,
  // potremmo eliminare la riga quando isAllowed è 0, ma mantenere la riga esplicita è più chiaro.
  try {
    await pool.query(
      `INSERT INTO permission_exceptions (tenant_id, employee_id, permission_id, is_allowed)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_allowed = ?`,
      [tenantId, user_id, permission_id, isAllowed ? 1 : 0, isAllowed ? 1 : 0]
    );
    return true;
  } catch (e) {
    return false;
  }
}

export async function createPermission(permissionCode: string, description: string): Promise<number | null> {
  try {
    const [res]: any = await pool.query(
      `INSERT INTO permissions (permission_code, description) VALUES (?, ?)`,
      [permissionCode, description]
    );
    return res.insertId;
  } catch (e: any) {
  // errore di duplicato o altro
    return null;
  }
}

export async function editRolePermission(tenantId: number, roleId: number, permissionId: number, allowed: number): Promise<boolean> {
  try {
    if (allowed) {
      await pool.query(
        `INSERT INTO role_permission (tenant_id, role_id, permission_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE permission_id = permission_id`,
        [tenantId, roleId, permissionId]
      );
    } else {
      // Se allowed = 0, elimina il record (il permesso non è più assegnato)
      await pool.query(
        `DELETE FROM role_permission WHERE tenant_id = ? AND role_id = ? AND permission_id = ?`,
        [tenantId, roleId, permissionId]
      );
    }
    return true;
  } catch (e) {
    console.error("Error editing role permission:", e);
    return false;
  }
}

export async function getRolePermissions(tenantId: number, roleId: number): Promise<Permission[]> {
  try {
    const [rows]: any = await pool.query(
      `SELECT p.id, p.permission_code, p.description
       FROM permissions p
        JOIN role_permission rp ON p.id = rp.permission_id
       WHERE rp.tenant_id = ? AND rp.role_id = ?
       ORDER BY p.permission_code`,
      [tenantId, roleId]
    );
    return (rows || []) as Permission[];
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return [];
  }
}
