import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getEmployeeAnomalies, getEmployeeAnomaliesCount, getAnomalyById } from "@/lib/db/anomalies";
import pool from "@/lib/db";

/**
 * @swagger
 * /api/anomalies:
 *   get:
 *     tags:
 *       - Anomalies
 *     summary: Get anomalies
 *     description: |
 *       Retrieve attendance anomalies.
 *       By default returns anomalies for the authenticated user.
 *       Pass employeeId=all to view all anomalies (requires anomalies_view_all permission).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: query
 *         schema:
 *           type: string
 *         description: Pass "all" to view all anomalies (admin only). Defaults to current user.
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [open, in_progress, closed]
 *         description: Filter by anomaly status
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (starts at 1). Omit for all results without pagination.
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page. Omit for all results without pagination.
 *     responses:
 *       200:
 *         description: Anomalies retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 anomalies:
 *                   - id: 1
 *                     description: Missing clock-out
 *                     status: open
 *                     reportedAt: 2024-01-14T15:30:00Z
 *                     reporterId: 5
 *                     reporterName: John Doe
 *                     assignedEmployeeId: 3
 *                     assignedEmployeeName: Jane Smith
 *                     resolvedAt: null
 *                     resolverId: null
 *                     resolverName: null
 *                     resolutionNotes: null
 *                 pagination:
 *                   page: 1
 *                   limit: 50
 *                   total: 3
 *                   totalPages: 1
 *                   hasNextPage: false
 *                   hasPrevPage: false
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 *   post:
 *     tags:
 *       - Anomalies
 *     summary: Create anomaly
 *     description: Create a new attendance anomaly. Requires report_anomaly permission.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - description
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee with the anomaly
 *               description:
 *                 type: string
 *                 description: Description of the anomaly
 *     responses:
 *       201:
 *         description: Anomaly created successfully
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation failed (invalid employeeId, invalid description)
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const employeeIdParam = searchParams.get("employeeId");
    const statusFilter = searchParams.get("status");
    
    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    // Verifica permesso di vista storico
    const hasPerm = await checkUserPermission(tenantId, employeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    // Se employeeId=all, ottieni tutte le anomalie
    const isViewingAll = employeeIdParam === 'all';
    
    if (isViewingAll) {
      // Verifica permesso anomalies_view_all
      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "anomalies_view_all");
      if (!hasAdminPerm) {
        return errorResponse("Permission denied: you can't view all anomalies", 403);
      }
    }

    let anomalies;
    let response: unknown;
    let total = 0;

    if (hasPagination) {
      const validStatuses = ["open", "in_progress", "closed"];
      if (statusFilter && !validStatuses.includes(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${validStatuses.join(", ")}`, 400);
      }

      // Costruisci query dinamicamente
      let query = `SELECT a.id, a.description, a.created_at, a.reporter_id, a.employee_Id as employee_id, a.resolver_id, a.status, a.resolution_notes, a.resolved_at,
        CONCAT(r.first_name, ' ', r.last_name) as reporter_name,
        CONCAT(res.first_name, ' ', res.last_name) as resolver_name,
        CONCAT(e.first_name, ' ', e.last_name) as assigned_employee_name
        FROM anomalies a
        LEFT JOIN employees r ON a.reporter_id = r.id AND a.tenant_id = r.tenant_id
        LEFT JOIN employees res ON a.resolver_id = res.id AND a.tenant_id = res.tenant_id
        LEFT JOIN employees e ON a.employee_Id = e.id AND a.tenant_id = e.tenant_id
        WHERE a.tenant_id = ?`;

      const params: unknown[] = [tenantId];

      // Se NON stai visualizzando tutte, filtra per il dipendente
      if (!isViewingAll) {
        query += ` AND a.employee_Id = ?`;
        params.push(employeeId);
      }

      if (statusFilter) {
        query += ` AND a.status = ?`;
        params.push(statusFilter);
      }

      query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows]: unknown = await pool.query(query, params);
      anomalies = rows;

      // Query per il totale
      let countQuery = `SELECT COUNT(*) as total FROM anomalies WHERE tenant_id = ?`;
      const countParams: unknown[] = [tenantId];

      if (!isViewingAll) {
        countQuery += ` AND employee_Id = ?`;
        countParams.push(employeeId);
      }

      if (statusFilter) {
        countQuery += ` AND status = ?`;
        countParams.push(statusFilter);
      }

      const [countResult]: unknown = await pool.query(countQuery, countParams);
      total = countResult[0]?.total || 0;

      const totalPages = Math.ceil(total / limit) || 1;

      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
      response = {
        anomalies: anomalies.map((a: unknown) => {
          const anomaly: unknown = {
            id: a.id,
            description: a.description,
            status: a.status,
            reportedAt: a.created_at,
            resolvedAt: a.resolved_at,
            resolutionNotes: a.resolution_notes,
          };
          if (hasAdminPerm) {
            anomaly.reporterId = a.reporter_id;
            anomaly.reporterName = a.reporter_name;
            anomaly.resolverId = a.resolver_id;
            anomaly.resolverName = a.resolver_name;
            anomaly.assignedEmployeeId = a.employee_id;
            anomaly.assignedEmployeeName = a.assigned_employee_name;
          }
          return anomaly;
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } else {
      const validStatuses = ["open", "in_progress", "closed"];
      if (statusFilter && !validStatuses.includes(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${validStatuses.join(", ")}`, 400);
      }

      // Query senza paginazione
      let query = `SELECT a.id, a.description, a.created_at, a.reporter_id, a.employee_Id as employee_id, a.resolver_id, a.status, a.resolution_notes, a.resolved_at,
        CONCAT(r.first_name, ' ', r.last_name) as reporter_name,
        CONCAT(res.first_name, ' ', res.last_name) as resolver_name,
        CONCAT(e.first_name, ' ', e.last_name) as assigned_employee_name
        FROM anomalies a
        LEFT JOIN employees r ON a.reporter_id = r.id AND a.tenant_id = r.tenant_id
        LEFT JOIN employees res ON a.resolver_id = res.id AND a.tenant_id = res.tenant_id
        LEFT JOIN employees e ON a.employee_Id = e.id AND a.tenant_id = e.tenant_id
        WHERE a.tenant_id = ?`;

      const params: unknown[] = [tenantId];

      if (!isViewingAll) {
        query += ` AND a.employee_Id = ?`;
        params.push(employeeId);
      }

      if (statusFilter) {
        query += ` AND a.status = ?`;
        params.push(statusFilter);
      }

      query += ` ORDER BY a.created_at DESC`;

      const [rows]: unknown = await pool.query(query, params);
      anomalies = rows;

      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
      response = {
        anomalies: anomalies.map((a: unknown) => {
          const anomaly: unknown = {
            id: a.id,
            description: a.description,
            status: a.status,
            reportedAt: a.created_at,
            resolvedAt: a.resolved_at,
            resolutionNotes: a.resolution_notes,
          };
          if (hasAdminPerm) {
            anomaly.reporterId = a.reporter_id;
            anomaly.reporterName = a.reporter_name;
            anomaly.resolverId = a.resolver_id;
            anomaly.resolverName = a.resolver_name;
            anomaly.assignedEmployeeId = a.employee_id;
            anomaly.assignedEmployeeName = a.assigned_employee_name;
          }
          return anomaly;
        }),
      };
    }

    return successResponse(response, undefined, 200);
  } catch (error: unknown) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    // Permission check: report_anomaly
    const hasPerm = await checkUserPermission(tenantId, employeeId, "report_anomaly");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to report anomalies", 403);
    }

    const body = await req.json();
    const { employeeId: targetEmployeeId, description } = body;

    // Validation
    if (!targetEmployeeId || typeof targetEmployeeId !== "number") {
      return errorResponse("employeeId is required and must be a number", 422);
    }

    if (!description || typeof description !== "string" || description.trim() === "") {
      return errorResponse("description is required and must be a non-empty string", 422);
    }

    // Create the anomaly
    const [result]: unknown = await pool.query(
      `INSERT INTO anomalies (tenant_id, reporter_id, employee_Id, description, status, created_at)
       VALUES (?, ?, ?, ?, 'open', NOW())`,
      [tenantId, employeeId, targetEmployeeId, description.trim()]
    );
    
    if (!result.insertId) {
      return errorResponse("Failed to create anomaly", 500);
    }

    const newAnomaly = await getAnomalyById(tenantId, result.insertId);
    return successResponse(newAnomaly, "Anomaly created successfully", 201);
  } catch (error: unknown) {
    console.error("POST error:", error);
    return errorResponse(error.message || "Failed to create anomaly", 500);
  }
}
