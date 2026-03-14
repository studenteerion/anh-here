import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllDepartments, createDepartment } from "@/lib/db/departments";

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags:
 *       - Departments
 *     summary: List all departments
 *     description: Retrieve a paginated list of all departments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of results to return
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departments:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
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

    const departments = await getAllDepartments(limit, offset);

    return successResponse({
      departments,
      count: departments.length,
      limit,
      offset,
    }, "Departments retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve departments", 500);
  }
}

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
