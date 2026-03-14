import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { createDepartment } from "@/lib/db/departments";

/**
 * @swagger
 * /api/departments/create:
 *   post:
 *     tags:
 *       - Departments
 *     summary: Create new department
 *     description: Create a new department in the system
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departmentName
 *             properties:
 *               departmentName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 departmentName:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Permission denied
 *       409:
 *         description: Department with this name already exists
 *       500:
 *         description: Server error
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
    const { departmentName } = body;

    if (!departmentName) {
      return errorResponse("Missing required field: departmentName", 400);
    }

    const departmentId = await createDepartment(departmentName);

    return successResponse({
      id: departmentId,
      departmentName,
    }, "Department created successfully", 201);
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return errorResponse("Department with this name already exists", 409);
    }
    return errorResponse(error.message || "Failed to create department", 500);
  }
}
