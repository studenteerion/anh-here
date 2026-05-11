import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getDepartmentById, updateDepartment, deleteDepartment } from "@/lib/db/departments";

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     tags:
 *       - Departments
 *     summary: Get department by ID
 *     description: Retrieve a specific department details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Department retrieved successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 *   put:
 *     tags:
 *       - Departments
 *     summary: Update department
 *     description: Update department name
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departmentName
 *             properties:
 *               departmentName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation failed (missing departmentName, failed to update)
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags:
 *       - Departments
 *     summary: Delete department
 *     description: Delete a specific department
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const departmentId = parseInt(id);
    const department = await getDepartmentById(tenantId, departmentId);

    if (!department) {
      return errorResponse("Department not found", 404);
    }

    return successResponse(department, "Department retrieved", 200);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to retrieve department";
    return errorResponse(msg, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_update");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const departmentId = parseInt(id);
    const department = await getDepartmentById(tenantId, departmentId);

    if (!department) {
      return errorResponse("Department not found", 404);
    }

    const body = await req.json();
    const { departmentName } = body;

    if (!departmentName) {
      return errorResponse("Missing required field: departmentName", 422);
    }

    const updated = await updateDepartment(tenantId, departmentId, departmentName);

    if (!updated) {
      return errorResponse("Failed to update department", 422);
    }

    const updatedDepartment = await getDepartmentById(tenantId, departmentId);
    return successResponse(updatedDepartment, "Department updated successfully", 200);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update department";
    return errorResponse(msg, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "delete_departments");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const departmentId = parseInt(id);
    const department = await getDepartmentById(tenantId, departmentId);

    if (!department) {
      return errorResponse("Department not found", 404);
    }

    await deleteDepartment(tenantId, departmentId);

    return successResponse({ id: departmentId }, "Department deleted successfully", 200);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete department";
    return errorResponse(msg, 500);
  }
}
