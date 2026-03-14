import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getUserLeaveRequests } from "@/lib/db/requests";

/**
 * @swagger
 * /api/requests/list:
 *   get:
 *     tags:
 *       - Leave Requests
 *     summary: List leave requests
 *     description: Retrieve all leave requests for the authenticated user with optional status filtering
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by request status
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid status filter
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
    const statusFilter = searchParams.get("status");

    // Ottieni tutte le richieste dell'utente
    let requests: any[] = await getUserLeaveRequests(employeeId);

    // Filtra per status se specificato
    if (statusFilter) {
      const validStatuses = ["pending", "approved", "rejected"];
      if (!validStatuses.includes(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${validStatuses.join(", ")}`, 400);
      }

      requests = requests.filter((r: any) => r.status === statusFilter);
    }

    return successResponse({
        count: requests.length,
        requests: requests.map((r: any) => ({
          id: r.id,
          type: r.type,
          startDate: r.start_datetime,
          endDate: r.end_datetime,
          motivation: r.motivation,
          status: r.status,
          requestedAt: r.request_date,
          approver1Status: r.approver1_status,
          approver2Status: r.approver2_status,
        })),
      }, undefined, 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
