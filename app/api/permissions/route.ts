import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission, getUserPermissionsById } from "@/lib/db/permissions";

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     tags:
 *       - Permissions
 *     summary: Get user permissions
 *     description: Retrieve permissions for the authenticated user or another user (requires permission)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: query
 *         schema:
 *           type: integer
 *         description: User ID to get permissions for (defaults to authenticated user)
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 role_id:
 *                   type: integer
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Insufficient permissions to view other users' permissions
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const userId = authResult.payload!.sub;
  const roleId = authResult.payload!.data?.role_id ?? null;

  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");
    let targetUserId = userId;

    if (idParam && idParam !== String(userId)) {
      // need permission to read others
      const hasPerm = await checkUserPermission(userId, "user_permissions_read");
      if (!hasPerm) {
        return errorResponse("Insufficient permissions to view other users' authorizations", 403);
      }
      targetUserId = Number(idParam);
    }

    const permissionsList = await getUserPermissionsById(targetUserId);

    return successResponse({ user_id: userId, role_id: roleId, permissions: permissionsList }, undefined, 200);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}
