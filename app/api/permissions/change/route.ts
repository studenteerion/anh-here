import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission, addPermissionToUser } from "@/lib/db/permissions";

/**
 * @swagger
 * /api/permissions/change:
 *   post:
 *     tags:
 *       - Permissions
 *     summary: Change user permission
 *     description: Grant or revoke a specific permission for a user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permissionId
 *               - isAllowed
 *             properties:
 *               userId:
 *                 type: integer
 *               permissionId:
 *                 type: integer
 *               isAllowed:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: Permission changed successfully
 *       400:
 *         description: Missing required data
 *       403:
 *         description: Insufficient permissions or cannot change own permissions
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const myUserId = authResult.payload!.sub;

  try {
    const body = await req.json();
    const targetUserId = body.userId;
    const permissionId = body.permissionId;
    const isAllowed = Number(body.isAllowed ?? 0);

    if (!targetUserId || !permissionId) {
      return errorResponse("Missing data (userId or permissionId)", 400);
    }

    if (myUserId === targetUserId) {
      return errorResponse("You cannot change your own permissions", 403);
    }

    const hasPerm = await checkUserPermission(myUserId, "user_permissions_update");
    if (!hasPerm) {
      return errorResponse("Insufficient permissions to change other users' authorizations", 403);
    }

    await addPermissionToUser(targetUserId, Number(permissionId), isAllowed);

    return successResponse(undefined, "Permission successfully changed", 200);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}
