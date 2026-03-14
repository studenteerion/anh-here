import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { createRole } from "@/lib/db/roles";

/**
 * @swagger
 * /api/roles/create:
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
      return errorResponse("Missing required field: roleName", 400);
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
