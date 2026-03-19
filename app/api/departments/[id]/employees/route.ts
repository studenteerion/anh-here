import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getEmployeesByDepartment } from "@/lib/db/employees";
import { getDepartmentById } from "@/lib/db/departments";
import { countRows } from "@/lib/db/utils";
import { Employee } from "@/types/employees";
import { isValidEmployeeStatus, EMPLOYEE_STATUSES } from "@/lib/validation/enums";

/**
 * @swagger
 * /api/departments/{id}/employees:
 *   get:
 *     tags:
 *       - Departments
 *     summary: Get employees in a department
 *     description: |
 *       Retrieve all employees in a specific department.
 *       Supports optional pagination and status filtering.
 *       Paginazione opzionale: se non specifichi page/limit, restituisce tutti i risultati.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by employee status
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination (requires limit)
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of employees per page (requires page)
 *     responses:
 *       200:
 *         description: Employees in department (with or without pagination)
 *         content:
 *           application/json:
 *             example:
 *               employees:
 *                 - id: 1
 *                   firstName: John
 *                   lastName: Doe
 *                   email: john@example.com
 *                   roleId: 1
 *                   departmentId: 5
 *                   status: active
 *                   createdAt: 2024-01-15T10:00:00Z
 *                   updatedAt: 2024-01-15T10:00:00Z
 *                 - id: 2
 *                   firstName: Jane
 *                   lastName: Smith
 *                   email: jane@example.com
 *                   roleId: 2
 *                   departmentId: 5
 *                   status: active
 *                   createdAt: 2024-01-16T10:00:00Z
 *                   updatedAt: 2024-01-16T10:00:00Z
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 2
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               departmentId: 5
 *       400:
 *         description: Invalid pagination parameters or status filter
 *         content:
 *           application/json:
 *             example:
 *               error: "Page 5 does not exist. Total pages: 2"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Department not found
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const { id } = await context.params;
    const departmentId = parseInt(id);

    // Verifica che il dipartimento esista
    const department = await getDepartmentById(departmentId);
    if (!department) {
      return errorResponse("Department not found", 404);
    }

    // Verifica permessi
    const hasPerm = await checkUserPermission(employeeId, "user_permissions_read");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const searchParams = req.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    let employees;
    let response: any;

    if (hasPagination) {
      if (statusFilter && !isValidEmployeeStatus(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${EMPLOYEE_STATUSES.join(", ")}`, 400);
      }

      employees = await getEmployeesByDepartment(departmentId, {
        status: statusFilter as any,
        limit,
        offset,
      });
      let whereClause = 'department_id = ?';
      const params: any[] = [departmentId];
      if (statusFilter) {
        whereClause += ' AND status = ?';
        params.push(statusFilter);
      }
      let total = await countRows('employees', whereClause, params);

      const totalPages = Math.ceil(total / limit) || 1;

      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      response = {
        employees: employees.map((e: any) => ({
          id: e.id,
          firstName: e.first_name,
          lastName: e.last_name,
          roleId: e.role_id,
          departmentId: e.department_id,
          status: e.status,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        departmentId,
      };
    } else {
      if (statusFilter && !isValidEmployeeStatus(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${EMPLOYEE_STATUSES.join(", ")}`, 400);
      }

      employees = await getEmployeesByDepartment(departmentId, {
        status: statusFilter as any,
      });

      response = {
        employees: employees.map((e: any) => ({
          id: e.id,
          firstName: e.first_name,
          lastName: e.last_name,
          roleId: e.role_id,
          departmentId: e.department_id,
          status: e.status,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        })),
        departmentId,
      };
    }

    return successResponse(response, undefined, 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
