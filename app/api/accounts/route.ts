import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAllUserAccounts, getUserAccountsCount } from "@/lib/db/userAccounts";
import { isValidEmployeeStatus, EMPLOYEE_STATUSES } from "@/lib/validation/enums";

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     tags:
 *       - User Accounts
 *     summary: List all user accounts
 *     description: |
 *       Retrieve paginated list of all user accounts.
 *       Only accessible to admins or managers with manage_accounts permission.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by account status (active = logged in within 30 days, inactive = never logged in or no login for 30+ days)
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
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: User accounts retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               accounts:
 *                 - employeeId: 1
 *                   email: john.doe@example.com
 *                   status: active
 *                   createdAt: 2026-01-15T10:30:00Z
 *                   updatedAt: 2026-01-15T10:30:00Z
 *                   lastLogin: 2026-03-15T17:00:00Z
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 15
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "manage_accounts");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to this feature",
        403
      );
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    let accounts;
    let response: any;

    if (hasPagination) {
      if (statusFilter && !isValidEmployeeStatus(statusFilter)) {
        return errorResponse(
          `Status must be one of: ${EMPLOYEE_STATUSES.join(", ")}`,
          400
        );
      }

      accounts = await getAllUserAccounts(tenantId, {
        status: statusFilter as any,
        limit,
        offset,
      });
      const total = await getUserAccountsCount(tenantId, {
        status: statusFilter as any,
      });
      const totalPages = Math.ceil(total / limit) || 1;

      if (page > totalPages && total > 0) {
        return errorResponse(
          `Page ${page} does not exist. Total pages: ${totalPages}`,
          400
        );
      }

      response = {
        accounts: accounts.map((a) => {
          const lastLoginDate = a.last_login ? new Date(a.last_login) : null;
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const status = lastLoginDate && lastLoginDate > thirtyDaysAgo ? "active" : "inactive";
          
          return {
            employeeId: a.employee_id,
            email: a.email,
            status,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
            lastLogin: a.last_login,
          };
        }),
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
      if (statusFilter && !isValidEmployeeStatus(statusFilter)) {
        return errorResponse(
          `Status must be one of: ${EMPLOYEE_STATUSES.join(", ")}`,
          400
        );
      }

      accounts = await getAllUserAccounts(tenantId, {
        status: statusFilter as any,
      });

      response = {
        accounts: accounts.map((a) => {
          const lastLoginDate = a.last_login ? new Date(a.last_login) : null;
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const status = lastLoginDate && lastLoginDate > thirtyDaysAgo ? "active" : "inactive";
          
          return {
            employeeId: a.employee_id,
            email: a.email,
            status,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
            lastLogin: a.last_login,
          };
        }),
      };
    }

    return successResponse(response, "User accounts retrieved", 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to retrieve accounts", 500);
  }
}
