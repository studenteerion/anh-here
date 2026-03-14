import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getEmployeeAnomalies, getEmployeeAnomaliesCount, createAnomaly, getAnomalyById, updateAnomaly, deleteAnomaly } from "@/lib/db/anomalies";
import { Anomaly } from "@/types/anomalies";

/**
 * @swagger
 * /api/notifications/anomalies:
 *   get:
 *     tags:
 *       - Anomalies
 *     summary: Get anomalies
 *     description: |
 *       Retrieve attendance anomalies.
 *       By default returns anomalies for the authenticated user.
 *       Admins can specify employeeId query parameter to view other users' anomalies.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Employee ID to get anomalies for (admin only, defaults to current user)
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [open, resolved]
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
 *               anomalies:
 *                 - id: 1
 *                   description: Missing clock-out
 *                   status: open
 *                   reportedAt: 2024-01-14T15:30:00Z
 *                   resolvedAt: null
 *                   resolutionNotes: null
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 3
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               employeeId: 5
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 *   post:
 *     tags:
 *       - Anomalies
 *     summary: Create anomaly
 *     description: Create a new attendance anomaly
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
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const requestedEmployeeId = searchParams.get("employeeId");
    const statusFilter = searchParams.get("status");
    
    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    // Determina di quale utente ottenere le anomalie
    let targetEmployeeId = employeeId;

    // Se viene richiesto un employeeId diverso, verifica i permessi
    if (requestedEmployeeId) {
      targetEmployeeId = parseInt(requestedEmployeeId);
      
      // Solo gli admin con permesso possono vedere le anomalie di altri utenti
      if (targetEmployeeId !== employeeId) {
        const hasPermission = await checkUserPermission(employeeId, "user_permissions_read");
        if (!hasPermission) {
          return errorResponse("Permission denied: you can only view your own anomalies", 403);
        }
      }
    }

    // Verifica permesso di vista storico
    const hasPerm = await checkUserPermission(employeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    let anomalies;
    let response: any;

    if (hasPagination) {
      const validStatuses = ["open", "in_progress", "closed"];
      if (statusFilter && !validStatuses.includes(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${validStatuses.join(", ")}`, 400);
      }

      anomalies = await getEmployeeAnomalies(targetEmployeeId, {
        status: statusFilter as any,
        limit,
        offset,
      });
      let total = await getEmployeeAnomaliesCount(targetEmployeeId, {
        status: statusFilter as any,
      });

      const totalPages = Math.ceil(total / limit) || 1;

      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      response = {
        anomalies: anomalies.map((a: any) => ({
          id: a.id,
          description: a.description,
          status: a.status,
          reportedAt: a.created_at,
          resolvedAt: a.resolved_at,
          resolutionNotes: a.resolution_notes,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        employeeId: targetEmployeeId,
      };
    } else {
      const validStatuses = ["open", "in_progress", "closed"];
      if (statusFilter && !validStatuses.includes(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${validStatuses.join(", ")}`, 400);
      }

      anomalies = await getEmployeeAnomalies(targetEmployeeId, {
        status: statusFilter as any,
      });

      response = {
        anomalies: anomalies.map((a: any) => ({
          id: a.id,
          description: a.description,
          status: a.status,
          reportedAt: a.created_at,
          resolvedAt: a.resolved_at,
          resolutionNotes: a.resolution_notes,
        })),
        employeeId: targetEmployeeId,
      };
    }

    return successResponse(response, undefined, 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
