import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllEmployees, getEmployeeById, createEmployee, getEmployeesCount } from "@/lib/db/employees";
import { exists } from "@/lib/db/utils";
import { Employee } from "@/types/employees";
import { isValidEmployeeStatus, EMPLOYEE_STATUSES } from "@/lib/validation/enums";
import { hashPassword } from "@/lib/auth";

/**
 * @swagger
 * /api/employees:
 *   get:
 *     tags:
 *       - Employees
 *     summary: List all employees
 *     description: |
 *       Retrieve paginated list of all employees.
 *       Supports optional status filtering and pagination.
 *       Paginazione opzionale: se non specifichi page/limit, restituisce tutti i risultati.
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: Page number (starts at 1). Omit for all results without pagination.
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page. Omit for all results without pagination.
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Employees retrieved successfully (with or without pagination)
 *         content:
 *           application/json:
 *             example:
 *               employees:
 *                 - id: 1
 *                   first_name: John
 *                   last_name: Doe
 *                   role_id: 1
 *                   department_id: 1
 *                   status: active
 *                   created_at: 2024-01-15T10:30:00Z
 *                   updated_at: 2024-01-15T10:30:00Z
 *                 - id: 2
 *                   first_name: Jane
 *                   last_name: Smith
 *                   role_id: 2
 *                   department_id: 1
 *                   status: active
 *                   created_at: 2024-01-16T10:30:00Z
 *                   updated_at: 2024-01-16T10:30:00Z
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 125
 *                 totalPages: 3
 *                 hasNextPage: true
 *                 hasPrevPage: false
 *       400:
 *         description: Invalid pagination parameters
 *       422:
 *         description: Invalid status filter
 *       403:
 *         description: Permission denied
 *   post:
 *     tags:
 *       - Employees
 *     summary: Create new employee
 *     description: Create a new employee account with assigned role and department
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - roleId
 *               - departmentId
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               departmentId:
 *                 type: integer
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 roleId:
 *                   type: integer
 *                 departmentId:
 *                   type: integer
 *                 email:
 *                   type: string
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation failed (missing fields, invalid foreign keys)
 *       403:
 *         description: Permission denied
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const searchFilter = (url.searchParams.get("search") || "").trim();
    const sortByParam = (url.searchParams.get("sortBy") || "created_at").trim();
    const sortOrderParam = (url.searchParams.get("sortOrder") || "desc").trim().toLowerCase();
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const allowedSortBy = ["created_at", "first_name", "last_name", "id"] as const;
    const allowedSortOrder = ["asc", "desc"] as const;
    const sortBy = allowedSortBy.includes(sortByParam as any)
      ? (sortByParam as (typeof allowedSortBy)[number])
      : "created_at";
    const sortOrder = allowedSortOrder.includes(sortOrderParam as any)
      ? (sortOrderParam as (typeof allowedSortOrder)[number])
      : "desc";
    
    // Se non specifici pagination parameters, restituisci tutto
    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    let employees;
    let total = 0;
    let response: any;

    if (hasPagination) {
      if (statusFilter && !isValidEmployeeStatus(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${EMPLOYEE_STATUSES.join(", ")}`, 400);
      }

      employees = await getAllEmployees(tenantId, {
        status: statusFilter as any,
        search: searchFilter || undefined,
        sortBy,
        sortOrder,
        limit,
        offset,
      });

      total = await getEmployeesCount(tenantId, {
        status: statusFilter as any,
        search: searchFilter || undefined,
      });

      const totalPages = Math.ceil(total / limit) || 1;

      // Valida pagina fuori range
      if (page > totalPages && total > 0) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      response = {
        employees,
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
      if (statusFilter && !isValidEmployeeStatus(statusFilter)) {
        return errorResponse(`Status deve essere uno di: ${EMPLOYEE_STATUSES.join(", ")}`, 400);
      }

      // Restituisci tutti i risultati
      employees = await getAllEmployees(tenantId, {
        status: statusFilter as any,
        search: searchFilter || undefined,
        sortBy,
        sortOrder,
      });
      response = {
        employees,
      };
    }

    return successResponse(response, "Employees retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve employees", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_create");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const body = await req.json();
    const { firstName, lastName, roleId, departmentId, email, password } = body;

    if (!firstName || !lastName || !roleId || !departmentId || !email || !password) {
      return errorResponse("Missing required fields: firstName, lastName, roleId, departmentId, email, password", 422);
    }

    // Validate foreign keys
    const [roleValid, deptValid] = await Promise.all([
      exists('roles', tenantId, roleId),
      exists('departments', tenantId, departmentId)
    ]);

    if (!roleValid) {
      return errorResponse(`Role with ID ${roleId} does not exist`, 422);
    }

    if (!deptValid) {
      return errorResponse(`Department with ID ${departmentId} does not exist`, 422);
    }

    const passwordHash = hashPassword(password);
    const newEmployeeId = await createEmployee(tenantId, firstName, lastName, roleId, departmentId, email, passwordHash);

    return successResponse({
      id: newEmployeeId,
      firstName,
      lastName,
      roleId,
      departmentId,
      email,
    }, "Employee created successfully", 201);
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return errorResponse("Email already exists", 409);
    }
    return errorResponse(error.message || "Failed to create employee", 500);
  }
}
