import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllShifts, getShiftsByDepartment, createShift, getShiftsCount } from "@/lib/db/shifts";
import { Shift } from "@/types/shifts";

/**
 * @swagger
 * /api/shifts:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: List all shifts
 *     description: Retrieve paginated list of shifts with optional department filter
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: departmentId
 *         in: query
 *         schema:
 *           type: integer
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
 *         description: Shifts retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               shifts:
 *                 - id: 1
 *                   department_id: 2
 *                   name: Morning Shift
 *                   start_time: "08:00:00"
 *                   end_time: "16:00:00"
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 8
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       403:
 *         description: Permission denied
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Create new shift
 *     description: Create a new shift (requires create permission)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departmentId
 *               - startTime
 *               - endTime
 *             properties:
 *               departmentId:
 *                 type: integer
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       403:
 *         description: Permission denied
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation failed (missing fields, invalid date format, invalid time range)
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const url = new URL(req.url);
    const departmentId = url.searchParams.get("departmentId");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    
    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    let shifts;
    let response: unknown;
    
    if (departmentId) {
      shifts = await getShiftsByDepartment(tenantId, parseInt(departmentId));
      response = { shifts };
    } else if (hasPagination) {
      shifts = await getAllShifts(tenantId, { limit, offset });
      const total = await getShiftsCount(tenantId);
      const totalPages = Math.ceil(total / limit) || 1;

      // Valida pagina fuori range
      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      response = {
        shifts,
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
      shifts = await getAllShifts(tenantId);
      response = { shifts };
    }

    return successResponse(response, "Shifts retrieved", 200);
  } catch (error: unknown) {
    return errorResponse(error.message || "Failed to retrieve shifts", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_create");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const body = await req.json();
    const { departmentId, name, startTime, endTime } = body;

    if (!departmentId || !startTime || !endTime) {
      return errorResponse("Missing required fields: departmentId, startTime, endTime", 422);
    }

    // Parse ISO strings to validate format and check duration
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse("Invalid date format. Use ISO format: YYYY-MM-DDTHH:mm:ss", 422);
    }

    // Check duration (end time on next day is allowed)
    const durationMs = end.getTime() - start.getTime();
    const minDurationMs = 15 * 60 * 1000; // 15 minutes minimum
    
    if (durationMs < minDurationMs) {
      return errorResponse("Shift duration must be at least 15 minutes", 422);
    }

    // Convert ISO strings to MySQL datetime format (remove 'Z' if present, use local time as-is)
    const startTimeStr = startTime.replace('Z', '').replace('T', ' ').slice(0, 19);
    const endTimeStr = endTime.replace('Z', '').replace('T', ' ').slice(0, 19);

    const shiftId = await createShift(tenantId, departmentId, name || null, startTimeStr as unknown, endTimeStr as unknown);

    return successResponse({
      id: shiftId,
      departmentId,
      name: name || null,
      startTime,
      endTime,
    }, "Shift created successfully", 201);
  } catch (error: unknown) {
    return errorResponse(error.message || "Failed to create shift", 500);
  }
}
