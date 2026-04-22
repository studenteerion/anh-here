import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getRoleById, updateRole, deleteRole } from "@/lib/db/roles";

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get role by ID
 *     description: Retrieve a specific role details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Role retrieved successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 *   put:
 *     tags:
 *       - Roles
 *     summary: Update role
 *     description: Update role name
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
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
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation failed (missing roleName, failed to update)
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Delete role
 *     description: Delete a specific role
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "permissions_read_all");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const roleId = parseInt(id);
    const role = await getRoleById(tenantId, roleId);

    if (!role) {
      return errorResponse("Role not found", 404);
    }

    return successResponse(role, "Role retrieved", 200);
  } catch (error: unknown) {
    return errorResponse(error.message || "Failed to retrieve role", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_update");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const roleId = parseInt(id);
    const role = await getRoleById(tenantId, roleId);

    if (!role) {
      return errorResponse("Role not found", 404);
    }

    const body = await req.json();
    const { roleName } = body;

    if (!roleName) {
      return errorResponse("Missing required field: roleName", 422);
    }

    const updated = await updateRole(tenantId, roleId, roleName);

    if (!updated) {
      return errorResponse("Failed to update role", 422);
    }

    const updatedRole = await getRoleById(tenantId, roleId);
    return successResponse(updatedRole, "Role updated successfully", 200);
  } catch (error: unknown) {
    return errorResponse(error.message || "Failed to update role", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "delete_roles");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const roleId = parseInt(id);
    const role = await getRoleById(tenantId, roleId);

    if (!role) {
      return errorResponse("Role not found", 404);
    }

    await deleteRole(tenantId, roleId);

    return successResponse({ id: roleId }, "Role deleted successfully", 200);
  } catch (error: unknown) {
    return errorResponse(error.message || "Failed to delete role", 500);
  }
}
