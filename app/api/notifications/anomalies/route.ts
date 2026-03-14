import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getEmployeeAnomalies } from "@/lib/db/anomalies";

/**
 * @swagger
 * /api/notifications/anomalies:
 *   get:
 *     tags:
 *       - Anomalies
 *     summary: Get employee anomalies
 *     description: Retrieve a list of attendance anomalies for the authenticated employee
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    // Verifica permesso
    const hasPerm = await checkUserPermission(employeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    // Ottieni anomalie dell'utente dalla tabella
    const anomalies = await getEmployeeAnomalies(employeeId, limit);

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
    }, undefined, 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
