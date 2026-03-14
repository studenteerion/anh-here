import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { createLeaveRequest, getUserLeaveRequests } from "@/lib/db/requests";

/**
 * @swagger
 * /api/requests:
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
 *   post:
 *     tags:
 *       - Leave Requests
 *     summary: Create leave request
 *     description: Submit a new leave request with specified dates and type
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDatetime
 *               - endDatetime
 *               - type
 *             properties:
 *               startDatetime:
 *                 type: string
 *                 format: date-time
 *                 description: Start date (ISO format)
 *               endDatetime:
 *                 type: string
 *                 format: date-time
 *                 description: End date (ISO format)
 *               type:
 *                 type: string
 *                 enum: [sick, vacation, personal, other]
 *               motivation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: integer
 *                 type:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *       400:
 *         description: Missing required fields or validation failed
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
    const hasPerm = await checkUserPermission(employeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const searchParams = req.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");

    let requests: any[] = await getUserLeaveRequests(employeeId);

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

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "request_leave");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const body = await req.json();

    const { startDatetime, endDatetime, type, motivation } = body;

    if (!startDatetime || !endDatetime || !type) {
      return errorResponse("Dati mancanti: startDatetime, endDatetime, type richiesti", 400);
    }

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse("Date non valide. Usa formato ISO: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss", 400);
    }

    if (start >= end) {
      return errorResponse("La data di inizio deve essere prima della data di fine", 400);
    }

    const validTypes = ["sick", "vacation", "personal", "other"];
    if (!validTypes.includes(type)) {
      return errorResponse(`Type deve essere uno di: ${validTypes.join(", ")}`, 400);
    }

    const requestId = await createLeaveRequest(
      employeeId,
      start,
      end,
      type as any,
      motivation
    );

    return successResponse({
      requestId,
      type,
      startDate: start,
      endDate: end,
      status: "pending",
    }, "Richiesta creata con successo", 200);
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
