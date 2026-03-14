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
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               permissions:
 *                 - id: 1
 *                   permission_code: user_permissions_read
 *                   description: Can view other users' information
 *                 - id: 2
 *                   permission_code: user_permissions_create
 *                   description: Can create new users
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 28
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
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

    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    
    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    let allPermissions = await getAllPermissions();
    let response: any;

    if (hasPagination) {
      const total = allPermissions.length;
      const totalPages = Math.ceil(total / limit) || 1;

      // Valida pagina fuori range
      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      const paginatedList = allPermissions.slice(offset, offset + limit);

      response = {
        permissions: paginatedList,
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
      response = { permissions: allPermissions };
    }

    return successResponse(response, undefined, 200);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}
