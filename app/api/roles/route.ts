import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllRoles, createRole } from "@/lib/db/roles";
import { countRows } from "@/lib/db/utils";
import { Role } from "@/types/roles";

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: List all roles
 *     description: Retrieve a paginated list of all roles in the system
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
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               roles:
 *                 - id: 1
 *                   role_name: Admin
 *                 - id: 2
 *                   role_name: User
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 3
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 *   post:
 *     tags:
 *       - Roles
 *     summary: Create new role
 *     description: Create a new role in the system
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 roleName:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Permission denied
 *       409:
 *         description: Role with this name already exists
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "permissions_read_all");
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

    let roles;
    let response: any;

    if (hasPagination) {
      roles = await getAllRoles({ limit, offset });
      const total = await countRows('roles');
      const totalPages = Math.ceil(total / limit) || 1;

      // Valida pagina fuori range
      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      response = {
        roles,
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
      roles = await getAllRoles();
      response = { roles };
    }

    return successResponse(response, "Roles retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve roles", 500);
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
    const { roleName } = body;

    if (!roleName) {
      return errorResponse("Missing required field: roleName", 422);
    }

    const roleId = await createRole(roleName);

    return successResponse({
      id: roleId,
      roleName,
    }, "Role created successfully", 201);
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return errorResponse("Role with this name already exists", 409);
    }
    return errorResponse(error.message || "Failed to create role", 500);
  }
}
