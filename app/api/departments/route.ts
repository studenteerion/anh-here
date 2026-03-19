import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllDepartments, createDepartment } from "@/lib/db/departments";
import { countRows } from "@/lib/db/utils";
import { Department } from "@/types/departments";

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
 *         description: Departments retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               departments:
 *                 - id: 1
 *                   department_name: Engineering
 *                 - id: 2
 *                   department_name: Sales
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 5
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
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
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    
    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    let departments;
    let response: any;

    if (hasPagination) {
      departments = await getAllDepartments({ limit, offset });
      const total = await countRows('departments');
      const totalPages = Math.ceil(total / limit) || 1;

      // Valida pagina fuori range
      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      response = {
        departments,
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
      departments = await getAllDepartments();
      response = { departments };
    }

    return successResponse(response, "Departments retrieved", 200);
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
      return errorResponse("Missing required field: departmentName", 422);
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
