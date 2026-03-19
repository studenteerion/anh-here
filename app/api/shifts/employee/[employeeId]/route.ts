import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getShiftsByEmployee } from "@/lib/db/shifts";
import { getEmployeeById } from "@/lib/db/employees";

/**
 * @swagger
 * /api/shifts/employee/{employeeId}:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get shifts assigned to employee
 *     description: |
 *       Retrieve all shifts that are assigned to a specific employee.
 *       Shifts are assigned based on the employee's department.
 *       Only accessible to users who can view employee information.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       401:
*         description: Invalid or missing token
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
 *       400:
 *         description: Invalid employee ID
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const authenticatedEmployeeId = authResult.payload!.sub;

  try {
    // Check permission to view employee information
    const hasPerm = await checkUserPermission(authenticatedEmployeeId, "user_permissions_read");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to view employee information",
        403
      );
    }

    const { employeeId: employeeIdStr } = await params;
    const employeeId = parseInt(employeeIdStr);

    if (isNaN(employeeId)) {
      return errorResponse("Invalid employee ID", 422);
    }

    // Verify employee exists
    const employee = await getEmployeeById(employeeId);
    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    // Get shifts for the employee
    const shifts = await getShiftsByEmployee(employeeId);

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
      "Shifts retrieved successfully",
      200
    );
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to retrieve shifts", 500);
  }
}
