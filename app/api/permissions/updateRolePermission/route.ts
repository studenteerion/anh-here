import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission, editRolePermission } from "@/lib/db/permissions";

/**
 * @swagger
 * /api/permissions/updateRolePermission:
 *   post:
 *     tags:
 *       - Permissions
 *     summary: Update role permission
 *     description: Grant or revoke a specific permission for a role
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - permissionId
 *               - isAllowed
 *             properties:
 *               roleId:
 *                 type: integer
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
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const myUserId = authResult.payload!.sub;

  try {
    const body = await req.json();
    const roleId = body.roleId;
    const permissionId = body.permissionId;
    const allowed = Number(body.isAllowed ?? 1);

    if (!permissionId || !roleId) {
      return errorResponse("Dati mancanti (permissionId o roleId)", 400);
    }

    const hasPerm = await checkUserPermission(myUserId, "roles_permissions_update");
    if (!hasPerm) {
      return errorResponse("Permessi insufficienti per modificare le autorizzazioni dei ruoli", 403);
    }

    const result = await editRolePermission(Number(roleId), Number(permissionId), allowed);
    if (!result) {
      return errorResponse("Errore durante la modifica del permesso al ruolo", 409);
    }

    return successResponse(undefined, "Permesso modificato al ruolo con successo", 200);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}
