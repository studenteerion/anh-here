import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllRoles } from "@/lib/db/roles";

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
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of results to return
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       403:
 *         description: Permission denied
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
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : 50;
    const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : 0;

    const roles = await getAllRoles(limit, offset);

    return successResponse({
      roles,
      count: roles.length,
      limit,
      offset,
    }, "Roles retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve roles", 500);
  }
}
