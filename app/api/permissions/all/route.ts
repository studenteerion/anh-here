import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission, getAllPermissions } from "@/lib/db/permissions";

/**
 * @swagger
 * /api/permissions/all:
 *   get:
 *     tags:
 *       - Permissions
 *     summary: Get all permissions
 *     description: Retrieve a list of all available permissions in the system
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const userId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(userId, "permissions_read_all");
    if (!hasPerm) {
      return errorResponse("Insufficient permissions to access all authorizations", 403);
    }

    const allPermissions = await getAllPermissions();
    return successResponse({ permissions: allPermissions }, undefined, 200);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}
