import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { createShift } from "@/lib/db/shifts";

/**
 * @swagger
 * /api/shifts/create:
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
 *         description: Invalid request
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "user_permissions_create");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const body = await req.json();
    const { departmentId, name, startTime, endTime } = body;

    if (!departmentId || !startTime || !endTime) {
      return errorResponse("Missing required fields: departmentId, startTime, endTime", 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse("Invalid date format. Use ISO format: YYYY-MM-DDTHH:mm:ss", 400);
    }

    if (start >= end) {
      return errorResponse("Start time must be before end time", 400);
    }

    const shiftId = await createShift(departmentId, name || null, start, end);

    return successResponse({
      id: shiftId,
      departmentId,
      name: name || null,
      startTime,
      endTime,
    }, "Shift created successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to create shift", 500);
  }
}
