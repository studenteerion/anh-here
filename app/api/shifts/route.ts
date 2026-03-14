import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllShifts, getShiftsByDepartment } from "@/lib/db/shifts";

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
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Shifts retrieved successfully
 *       403:
 *         description: Permission denied
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "user_permissions_read");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const url = new URL(req.url);
    const departmentId = url.searchParams.get("departmentId");
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : 50;
    const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : 0;

    let shifts;
    if (departmentId) {
      shifts = await getShiftsByDepartment(parseInt(departmentId));
    } else {
      shifts = await getAllShifts(limit, offset);
    }

    return successResponse({
      shifts,
      count: shifts.length,
    }, "Shifts retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve shifts", 500);
  }
}
