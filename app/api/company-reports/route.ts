import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getAllCompanyReports,
  getCompanyReportsCount,
  createCompanyReport,
} from "@/lib/db/companyReports";

/**
 * @swagger
 * /api/company-reports:
 *   get:
 *     tags:
 *       - Company Reports
 *     summary: List company reports
 *     description: |
 *       Retrieve a paginated list of company reports.
 *       Regular employees can only view their own reports.
 *       Admins can view all reports with optional employeeId filter.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter by employee (admin only, defaults to current user)
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
 *         description: Company reports retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               reports:
 *                 - id: 1
 *                   employeeId: 5
 *                   link: https://drive.google.com/file/...
 *                   createdAt: 2026-02-15T10:30:00Z
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 12
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 *   post:
 *     tags:
 *       - Company Reports
 *     summary: Create company report
 *     description: Create a new company report with a link
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - link
 *             properties:
 *               link:
 *                 type: string
 *                 format: uri
 *                 description: URL link to the company report
 *     responses:
 *       201:
 *         description: Company report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 employeeId:
 *                   type: integer
 *                 link:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation failed (missing link, invalid URL format)
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
    const hasPerm = await checkUserPermission(tenantId, employeeId, "view_reports");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to this feature",
        403
      );
    }

    const url = new URL(req.url);
    const employeeIdParam = url.searchParams.get("employeeId");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    // Determina quale employee id usare
    let targetEmployeeId = employeeId;

    // Se viene richiesto un employeeId diverso, verifica i permessi
    if (employeeIdParam) {
      targetEmployeeId = parseInt(employeeIdParam);

      // Solo gli admin possono vedere i reports di altri utenti
      if (targetEmployeeId !== employeeId) {
        const hasAdminPerm = await checkUserPermission(
          tenantId,
          employeeId,
          "generate_reports"
        );
        if (!hasAdminPerm) {
          return errorResponse(
            "Permission denied: you can only view your own reports",
            403
          );
        }
      }
    }

    let reports;
    let response: unknown;

    if (hasPagination) {
      reports = await getAllCompanyReports(tenantId, {
        employeeId: targetEmployeeId,
        limit,
        offset,
      });
      const total = await getCompanyReportsCount(tenantId, {
        employeeId: targetEmployeeId,
      });
      const totalPages = Math.ceil(total / limit) || 1;

      if (page > totalPages && total > 0) {
        return errorResponse(
          `Page ${page} does not exist. Total pages: ${totalPages}`,
          400
        );
      }

      response = {
        reports: reports.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          link: r.link,
          createdAt: r.created_at,
        })),
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
      reports = await getAllCompanyReports(tenantId, {
        employeeId: targetEmployeeId,
      });

      response = {
        reports: reports.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          link: r.link,
          createdAt: r.created_at,
        })),
      };
    }

    return successResponse(response, "Company reports retrieved", 200);
  } catch (error: unknown) {
    console.error("Endpoint error:", error);
    const msg = error instanceof Error ? error.message : "Failed to retrieve reports";
    return errorResponse(msg, 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "generate_reports");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to this feature",
        403
      );
    }

    const body = await req.json();
    const { link } = body;

    if (!link) {
      return errorResponse("Missing required field: link", 422);
    }

    // Validazione URL
    try {
      new URL(link);
    } catch {
      return errorResponse("Invalid URL format for link", 422);
    }

    const reportId = await createCompanyReport(tenantId, employeeId, link);

    return successResponse(
      {
        id: reportId,
        employeeId,
        link,
        createdAt: new Date(),
      },
      "Company report created successfully",
      201
    );
  } catch (error: unknown) {
    console.error("Endpoint error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create report";
    return errorResponse(msg, 500);
  }
}
