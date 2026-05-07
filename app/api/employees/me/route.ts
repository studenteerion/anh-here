import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { getEmployeeById } from "@/lib/db/employees";

/**
 * @swagger
 * /api/employees/me:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get own profile
 *     description: Returns the profile of the currently authenticated user
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

    return successResponse(employee, "Your profile retrieved", 200);
  } catch (error: unknown) {
    let message = "Failed to retrieve your profile";
    if (error instanceof Error) {
      console.error('GET /api/employees/me error:', error);
      message = error.message;
    } else {
      console.error('GET /api/employees/me error:', String(error));
    }
    return errorResponse(message, 500);
  }
}
