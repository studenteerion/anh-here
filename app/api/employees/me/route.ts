import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { getEmployeeById } from "@/lib/db/employees";
import { getUserPermissionsById } from "@/lib/db/permissions";

/**
 * @swagger
 * /api/employees/me:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get own profile
 *     description: Returns the profile of the currently authenticated user with their permissions
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       401:
 *         description: Invalid or missing token
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Employee profile not found
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const employee = await getEmployeeById(tenantId, employeeId);

    if (!employee) {
      return errorResponse("Employee profile not found", 404);
    }

    // Fetch permissions for this employee
    const permissions = await getUserPermissionsById(tenantId, employeeId);
    const permissionCodes = permissions.map(p => p.permission_code);

    return successResponse({
      ...employee,
      permissions: permissionCodes
    }, "Your profile retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve your profile", 500);
  }
}
