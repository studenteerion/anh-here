import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { createLeaveRequest, getUserLeaveRequests, getUserLeaveRequestsCount } from "@/lib/db/requests";
import { LeaveRequest } from "@/types/requests";
import { isValidLeaveRequestType, isValidLeaveRequestStatus, LEAVE_REQUEST_TYPES, LEAVE_REQUEST_STATUSES } from "@/lib/validation/enums";

/**
 * @swagger
 * /api/requests:
 *   get:
 *     tags:
 *       - Leave Requests
 *     summary: List leave requests
 *     description: |
 *       Retrieve leave requests.
 *       By default returns requests for the authenticated user.
 *       Admins can specify employeeId query parameter to view other employees' requests.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Employee ID to get requests for (admin only, defaults to current user)
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by request status
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
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Leave requests retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               count: 2
 *               requests:
 *                 - id: 1
 *                   type: vacation
 *                   startDate: 2024-02-01T00:00:00Z
 *                   endDate: 2024-02-05T23:59:59Z
 *                   motivation: Summer vacation
 *                   status: approved
 *                   requestedAt: 2024-01-15T10:30:00Z
 *                   approver1Status: approved
 *                   approver2Status: approved
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 12
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               employeeId: 5
 *       400:
 *         description: Invalid pagination parameters
 *       422:
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
 *         description: Bad request
 *       422:
 *         description: Validation failed (missing fields, invalid dates, invalid type)
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
    const requestedEmployeeId = searchParams.get("employeeId");
    const statusFilter = searchParams.get("status");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    
    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    // Determina di quale utente ottenere le requests
    let targetEmployeeId = employeeId;

    // Se viene richiesto un employeeId diverso, verifica i permessi
    if (requestedEmployeeId) {
      targetEmployeeId = parseInt(requestedEmployeeId);
      
      // Solo gli admin con permesso possono vedere le requests di altri utenti
      if (targetEmployeeId !== employeeId) {
        const hasPermission = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
        if (!hasPermission) {
          return errorResponse("Permission denied: you can only view your own requests", 403);
        }
      }
    }

    const hasPerm = await checkUserPermission(tenantId, employeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    let requests: unknown[];
    let response: unknown;

     if (hasPagination) {
      if (statusFilter && !isValidLeaveRequestStatus(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${LEAVE_REQUEST_STATUSES.join(", ")}`, 400);
      }

      requests = await getUserLeaveRequests(tenantId, targetEmployeeId, {
  status: statusFilter as "approved" | "rejected" | "pending" | undefined,
        limit,
        offset,
      });
      const total = await getUserLeaveRequestsCount(tenantId, targetEmployeeId, {
        status: statusFilter as "approved" | "rejected" | "pending" | undefined,
      });

      const totalPages = Math.ceil(total / limit) || 1;

      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      response = {
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
      if (statusFilter && !isValidLeaveRequestStatus(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${LEAVE_REQUEST_STATUSES.join(", ")}`, 400);
      }

      requests = await getUserLeaveRequests(tenantId, targetEmployeeId, {
        status: statusFilter as "approved" | "rejected" | "pending" | undefined,
      });

      response = {
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
        employeeId: targetEmployeeId,
      };
    }

    return successResponse(response, undefined, 200);
  } catch (error: unknown) {
      let message = "Failed to retrieve requests";
      if (error instanceof Error) {
        console.error('GET /api/requests error:', error);
        message = error.message;
      } else {
        console.error('GET /api/requests error:', String(error));
      }
      return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "request_leave");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const body = await req.json();

    const { startDatetime, endDatetime, type, motivation } = body;

    if (!startDatetime || !endDatetime || !type) {
      return errorResponse("Dati mancanti: startDatetime, endDatetime, type richiesti", 422);
    }

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse("Date non valide. Usa formato ISO: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss", 422);
    }

    if (start >= end) {
      return errorResponse("La data di inizio deve essere prima della data di fine", 422);
    }

    if (!isValidLeaveRequestType(type)) {
      return errorResponse(`Type deve essere uno di: ${LEAVE_REQUEST_TYPES.join(", ")}`, 422);
    }

    const requestId = await createLeaveRequest(
      tenantId,
      employeeId,
      start,
      end,
      type as "sick" | "vacation" | "personal" | "other",
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
      let message = "Server error";
      if (error instanceof Error) {
        console.error('POST /api/requests error:', error);
        message = error.message;
      } else {
        console.error('POST /api/requests error:', String(error));
      }
      return errorResponse(message, 500);
  }
}
