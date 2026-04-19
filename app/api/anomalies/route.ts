import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getEmployeeAnomalies, getEmployeeAnomaliesCount, getAnomalyById } from "@/lib/db/anomalies";
import pool from "@/lib/db";

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
    let isViewingAll = employeeIdParam === 'all';
    
    if (isViewingAll) {
      // Verifica permesso anomalies_view_all
      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "anomalies_view_all");
      if (!hasAdminPerm) {
        return errorResponse("Permission denied: you can't view all anomalies", 403);
      }
    }

    let anomalies;
    let response: any;
    let total = 0;

    if (hasPagination) {
      const validStatuses = ["open", "in_progress", "closed"];
      if (statusFilter && !validStatuses.includes(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${validStatuses.join(", ")}`, 400);
      }

      // Costruisci query dinamicamente
      let query = `SELECT a.id, a.description, a.created_at, a.reporter_id, a.employee_Id as employee_id, a.resolver_id, a.status, a.resolution_notes, a.resolved_at,
        CONCAT(r.first_name, ' ', r.last_name) as reporter_name,
        CONCAT(res.first_name, ' ', res.last_name) as resolver_name
        FROM anomalies a
        LEFT JOIN employees r ON a.reporter_id = r.id AND a.tenant_id = r.tenant_id
        LEFT JOIN employees res ON a.resolver_id = res.id AND a.tenant_id = res.tenant_id
        WHERE a.tenant_id = ?`;

      const params: any[] = [tenantId];

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

      const [rows]: any = await pool.query(query, params);
      anomalies = rows;

      // Query per il totale
      let countQuery = `SELECT COUNT(*) as total FROM anomalies WHERE tenant_id = ?`;
      const countParams: any[] = [tenantId];

      if (!isViewingAll) {
        countQuery += ` AND employee_Id = ?`;
        countParams.push(employeeId);
      }

      if (statusFilter) {
        countQuery += ` AND status = ?`;
        countParams.push(statusFilter);
      }

      const [countResult]: any = await pool.query(countQuery, countParams);
      total = countResult[0]?.total || 0;

      const totalPages = Math.ceil(total / limit) || 1;

      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
      response = {
        anomalies: anomalies.map((a: any) => {
          const anomaly: any = {
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
        CONCAT(res.first_name, ' ', res.last_name) as resolver_name
        FROM anomalies a
        LEFT JOIN employees r ON a.reporter_id = r.id AND a.tenant_id = r.tenant_id
        LEFT JOIN employees res ON a.resolver_id = res.id AND a.tenant_id = res.tenant_id
        WHERE a.tenant_id = ?`;

      const params: any[] = [tenantId];

      if (!isViewingAll) {
        query += ` AND a.employee_Id = ?`;
        params.push(employeeId);
      }

      if (statusFilter) {
        query += ` AND a.status = ?`;
        params.push(statusFilter);
      }

      query += ` ORDER BY a.created_at DESC`;

      const [rows]: any = await pool.query(query, params);
      anomalies = rows;

      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
      response = {
        anomalies: anomalies.map((a: any) => {
          const anomaly: any = {
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
          }
          return anomaly;
        }),
      };
    }

    return successResponse(response, undefined, 200);
  } catch (error: any) {
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
    const [result]: any = await pool.query(
      `INSERT INTO anomalies (tenant_id, reporter_id, employee_Id, description, status, created_at)
       VALUES (?, ?, ?, ?, 'open', NOW())`,
      [tenantId, employeeId, targetEmployeeId, description.trim()]
    );
    
    if (!result.insertId) {
      return errorResponse("Failed to create anomaly", 500);
    }

    const newAnomaly = await getAnomalyById(tenantId, result.insertId);
    return successResponse(newAnomaly, "Anomaly created successfully", 201);
  } catch (error: any) {
    console.error("POST error:", error);
    return errorResponse(error.message || "Failed to create anomaly", 500);
  }
}
