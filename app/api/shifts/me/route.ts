import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { getShiftsByEmployee } from "@/lib/db/shifts";
import { getEmployeeById } from "@/lib/db/employees";

/**
 * @swagger
 * /api/shifts/me:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get my assigned shifts
 *     description: |
 *       Retrieve all shifts assigned to the authenticated user.
 *       Shifts are assigned based on the user's department.
 *       No additional permission required - users can always view their own shifts.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Shifts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                 shifts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       departmentId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *             example:
 *               employeeId: 5
 *               shifts:
 *                 - id: 1
 *                   departmentId: 2
 *                   name: "Morning Shift"
 *                   startTime: "08:00"
 *                   endTime: "16:00"
 *                 - id: 2
 *                   departmentId: 2
 *                   name: "Afternoon Shift"
 *                   startTime: "16:00"
 *                   endTime: "00:00"
 *       401:
 *         description: Invalid or missing token
 *       404:
 *         description: Employee data not found
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    // Verify employee exists (ensure user data is still in system)
    const employee = await getEmployeeById(tenantId, employeeId);
    if (!employee) {
      return errorResponse("Employee data not found", 404);
    }

    // Get shifts for the authenticated employee
    const shifts = await getShiftsByEmployee(tenantId, employeeId);

    return successResponse(
      {
        employeeId,
        shifts: shifts.map((shift) => ({
          id: shift.id,
          departmentId: shift.department_id,
          name: shift.name,
          startTime: shift.start_time,
          endTime: shift.end_time,
        })),
      },
      "Your shifts retrieved successfully",
      200
    );
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to retrieve shifts", 500);
  }
}
