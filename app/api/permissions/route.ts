import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission, getUserPermissionsById, createPermission } from "@/lib/db/permissions";
import { Permission } from "@/types/permissions";

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
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               user_id: 5
 *               role_id: 1
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
 *                 total: 15
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       403:
 *         description: Insufficient permissions to view other users' permissions
 *       500:
 *         description: Server error
 *   post:
 *     tags:
 *       - Permissions
 *     summary: Create new permission
 *     description: Create a new permission type in the system
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionCode
 *               - description
 *             properties:
 *               permissionCode:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Permission already exists
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const userId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;
  const roleId = authResult.payload!.data?.role_id ?? null;

  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    
    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;
    
    let targetUserId = userId;

    if (idParam && idParam !== String(userId)) {
      // need permission to read others
      const hasPerm = await checkUserPermission(tenantId, userId, "user_permissions_read");
      if (!hasPerm) {
        return errorResponse("Insufficient permissions to view other users' authorizations", 403);
      }
      targetUserId = Number(idParam);
    }

    let permissionsList = await getUserPermissionsById(tenantId, targetUserId);
    let response: any;

    if (hasPagination) {
      const total = permissionsList.length;
      const totalPages = Math.ceil(total / limit) || 1;

      // Valida pagina fuori range
      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      const paginatedList = permissionsList.slice(offset, offset + limit);

      response = {
        user_id: userId,
        role_id: roleId,
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
      response = {
        user_id: userId,
        role_id: roleId,
        permissions: permissionsList,
      };
    }

    return successResponse(response, undefined, 200);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const myUserId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const body = await req.json();
    const permissionCode = body.permissionCode;
    const description = body.description;

    if (!permissionCode || !description) {
      return errorResponse("Dati mancanti (permissionCode o description)", 400);
    }

    const hasPerm = await checkUserPermission(tenantId, myUserId, "user_permissions_create");
    if (!hasPerm) {
      return errorResponse("Permessi insufficienti per creare le autorizzazioni", 403);
    }

    const result = await createPermission(permissionCode, description);
    if (!result) {
      return errorResponse("Errore durante la creazione del permesso", 409);
    }

    return successResponse(undefined, "Permesso creato con successo", 201);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}
