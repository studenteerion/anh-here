import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllEmployees, getEmployeeById } from "@/lib/db/employees";

/**
 * @swagger
 * /api/employees:
 *   get:
 *     tags:
 *       - Employees
 *     summary: List all employees
 *     description: Retrieve paginated list of all employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: Employees retrieved successfully
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
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : 50;
    const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : 0;

    const employees = await getAllEmployees(limit, offset);

    return successResponse({
      employees,
      count: employees.length,
      limit,
      offset,
    }, "Employees retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve employees", 500);
  }
}
