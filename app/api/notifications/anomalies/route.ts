import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getEmployeeAnomalies } from "@/lib/db/anomalies";

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
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of anomalies to return
 *     responses:
 *       200:
 *         description: Anomalies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anomalies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       reportedAt:
 *                         type: string
 *                         format: date-time
 *                       resolvedAt:
 *                         type: string
 *                         format: date-time
 *                       resolutionNotes:
 *                         type: string
 *                 totalAnomalies:
 *                   type: integer
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const requestedEmployeeId = searchParams.get("employeeId");

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

    // Ottieni anomalie dell'utente specificato
    const anomalies = await getEmployeeAnomalies(targetEmployeeId, limit);

    return successResponse({
      anomalies: anomalies.map((a: any) => ({
        id: a.id,
        description: a.description,
        status: a.status,
        reportedAt: a.created_at,
        resolvedAt: a.resolved_at,
        resolutionNotes: a.resolution_notes,
      })),
      totalAnomalies: anomalies.length,
      employeeId: targetEmployeeId,
    }, undefined, 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
