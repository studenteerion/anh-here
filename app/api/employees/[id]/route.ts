import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/db/employees";

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get employee by ID
 *     description: Retrieve employee details by ID. Users can view their own profile, admins can view any
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Employee retrieved successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Employee not found
 *   put:
 *     tags:
 *       - Employees
 *     summary: Update employee
 *     description: Update employee information (requires admin permission)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               departmentId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Employee not found
 *   delete:
 *     tags:
 *       - Employees
 *     summary: Delete employee
 *     description: Delete employee from system (requires admin permission)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Employee not found
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const targetId = parseInt(id);
    
    // Se l'utente chiede le informazioni di un altro dipendente, verifica i permessi
    if (targetId !== employeeId) {
      const hasPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
      if (!hasPerm) {
        return errorResponse("Permission denied: you can only view your own profile", 403);
      }
    }

    const employee = await getEmployeeById(tenantId, targetId);

    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    return successResponse(employee, "Employee retrieved", 200);
  } catch (error: unknown) {
    let message = "Failed to retrieve employee";
    if (error instanceof Error) {
      console.error('GET /api/employees/[id] error:', error);
      message = error.message;
    } else {
      console.error('GET /api/employees/[id] error:', String(error));
    }
    return errorResponse(message, 500);
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

    const targetId = parseInt(id);
    const employee = await getEmployeeById(tenantId, targetId);

    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    const body = await req.json();
    const { firstName, lastName, roleId, departmentId, status } = body;

    const updated = await updateEmployee(tenantId, targetId, {
      firstName,
      lastName,
      roleId,
      departmentId,
      status,
    });

    if (!updated) {
      return errorResponse("No fields to update", 400);
    }

    const updatedEmployee = await getEmployeeById(tenantId, targetId);
    return successResponse(updatedEmployee, "Employee updated successfully", 200);
  } catch (error: unknown) {
    let message = "Failed to update employee";
    if (error instanceof Error) {
      console.error('PUT /api/employees/[id] error:', error);
      message = error.message;
    } else {
      console.error('PUT /api/employees/[id] error:', String(error));
    }
    return errorResponse(message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "delete_employees");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const targetId = parseInt(id);
    
    if (targetId === employeeId) {
      return errorResponse("Cannot delete your own account", 400);
    }

    const employee = await getEmployeeById(tenantId, targetId);
    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    await deleteEmployee(tenantId, targetId);

    return successResponse({ id: targetId }, "Employee deleted successfully", 200);
  } catch (error: unknown) {
    let message = "Failed to delete employee";
    if (error instanceof Error) {
      console.error('DELETE /api/employees/[id] error:', error);
      message = error.message;
    } else {
      console.error('DELETE /api/employees/[id] error:', String(error));
    }
    return errorResponse(message, 500);
  }
}
