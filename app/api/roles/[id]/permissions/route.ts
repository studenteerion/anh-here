import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission, editRolePermission, getRolePermissions } from "@/lib/db/permissions";

/**
 * @swagger
 * /api/roles/{roleId}/permissions:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get permissions assigned to a role
 *     description: Retrieve all permissions assigned to a specific role
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roleId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roleId:
 *                   type: integer
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       permission_code:
 *                         type: string
 *                       description:
 *                         type: string
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 *   patch:
 *     tags:
 *       - Roles
 *     summary: Update role permission
 *     description: Grant or revoke a specific permission for a role
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roleId
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
 *               - permissionId
 *               - isAllowed
 *             properties:
 *               permissionId:
 *                 type: integer
 *               isAllowed:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 1
 *     responses:
 *       200:
 *         description: Role permission updated successfully
 *       400:
 *         description: Missing required data
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Error updating permission
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
    const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to this feature",
        403
      );
    }

    const roleId = parseInt(id);
    const permissions = await getRolePermissions(tenantId, roleId);

    return successResponse(
      {
        roleId,
        permissions,
      },
      "Role permissions retrieved successfully",
      200
    );
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to retrieve role permissions", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const myUserId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const body = await req.json();
    const roleId = parseInt(id);
    const permissionId = body.permissionId;
    const allowed = Number(body.isAllowed ?? 1);

    if (!permissionId) {
      return errorResponse("Dati mancanti (permissionId)", 400);
    }

    const hasPerm = await checkUserPermission(tenantId, myUserId, "roles_permissions_update");
    if (!hasPerm) {
      return errorResponse("Permessi insufficienti per modificare le autorizzazioni dei ruoli", 403);
    }

    const result = await editRolePermission(tenantId, roleId, Number(permissionId), allowed);
    if (!result) {
      return errorResponse("Errore durante la modifica del permesso al ruolo", 409);
    }

    return successResponse(undefined, "Permesso modificato al ruolo con successo", 200);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}
