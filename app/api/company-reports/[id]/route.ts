import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getCompanyReportById,
  updateCompanyReport,
  deleteCompanyReport,
} from "@/lib/db/companyReports";

/**
 * @swagger
 * /api/company-reports/{id}:
 *   get:
 *     tags:
 *       - Company Reports
 *     summary: Get company report by ID
 *     description: Retrieve a specific company report. Users can only view their own reports unless they have admin permission.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Company report retrieved successfully
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
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 *   put:
 *     tags:
 *       - Company Reports
 *     summary: Update company report
 *     description: Update an existing company report. Users can only update their own reports unless they have admin permission.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
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
 *     responses:
 *       200:
 *         description: Company report updated successfully
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation failed (missing link, invalid URL format, failed to update)
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags:
 *       - Company Reports
 *     summary: Delete company report
 *     description: Delete a company report. Users can only delete their own reports unless they have admin permission.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Company report deleted successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const reportId = parseInt(id);

    const report = await getCompanyReportById(tenantId, reportId);
    if (!report) {
      return errorResponse("Report not found", 404);
    }

    // Verifica se l'utente è il proprietario o ha permesso admin
    if (report.employee_id !== employeeId) {
      const hasAdminPerm = await checkUserPermission(
        tenantId,
        employeeId,
        "generate_reports"
      );
      if (!hasAdminPerm) {
        return errorResponse("Permission denied: you can only view your own reports", 403);
      }
    }

    return successResponse(
      {
        id: report.id,
        employeeId: report.employee_id,
        link: report.link,
        createdAt: report.created_at,
      },
      "Report retrieved",
      200
    );
  } catch (error: unknown) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to retrieve report", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const reportId = parseInt(id);

    const report = await getCompanyReportById(tenantId, reportId);
    if (!report) {
      return errorResponse("Report not found", 404);
    }

    // Verifica se l'utente è il proprietario
    if (report.employee_id !== employeeId) {
      const hasAdminPerm = await checkUserPermission(
        tenantId,
        employeeId,
        "manage_accounts"
      );
      if (!hasAdminPerm) {
        return errorResponse("Permission denied: you can only update your own reports", 403);
      }
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

    const success = await updateCompanyReport(tenantId, reportId, link);

    if (!success) {
      return errorResponse("Failed to update report", 500);
    }

    return successResponse(
      {
        id: reportId,
        employeeId: report.employee_id,
        link,
        createdAt: report.created_at,
      },
      "Report updated successfully",
      200
    );
  } catch (error: unknown) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to update report", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "delete_reports");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to this feature",
        403
      );
    }

    const { id } = await params;
    const reportId = parseInt(id);

    const report = await getCompanyReportById(tenantId, reportId);
    if (!report) {
      return errorResponse("Report not found", 404);
    }

    // Verifica se l'utente è il proprietario
    if (report.employee_id !== employeeId) {
      const hasAdminPerm = await checkUserPermission(
        tenantId,
        employeeId,
        "manage_accounts"
      );
      if (!hasAdminPerm) {
        return errorResponse("Permission denied: you can only delete your own reports", 403);
      }
    }

    const success = await deleteCompanyReport(tenantId, reportId);

    if (!success) {
      return errorResponse("Failed to delete report", 500);
    }

    return successResponse({}, "Report deleted successfully", 200);
  } catch (error: unknown) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to delete report", 500);
  }
}
