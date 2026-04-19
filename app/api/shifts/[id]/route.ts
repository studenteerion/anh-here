import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getShiftById, updateShift, deleteShift } from "@/lib/db/shifts";

/**
 * @swagger
 * /api/shifts/{id}:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get shift by ID
 *     description: Retrieve a specific shift details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Shift retrieved successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 *   put:
 *     tags:
 *       - Shifts
 *     summary: Update shift
 *     description: Update shift details (name, start time, end time, or department)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               departmentId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *       400:
 *         description: Validation failed or no fields to update
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags:
 *       - Shifts
 *     summary: Delete shift
 *     description: Delete a specific shift
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift deleted successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Shift not found
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

    const shiftId = parseInt(id);
    const shift = await getShiftById(tenantId, shiftId);

    if (!shift) {
      return errorResponse("Shift not found", 404);
    }

    return successResponse(shift, "Shift retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve shift", 500);
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

    const shiftId = parseInt(id);
    const shift = await getShiftById(tenantId, shiftId);

    if (!shift) {
      return errorResponse("Shift not found", 404);
    }

    const body = await req.json();
    const { name, startTime, endTime, departmentId } = body;

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const durationMs = end.getTime() - start.getTime();
      const minDurationMs = 15 * 60 * 1000; // 15 minutes minimum
      
      if (durationMs < minDurationMs) {
        return errorResponse("Shift duration must be at least 15 minutes", 400);
      }
    }

    // Convert ISO strings to MySQL datetime format (remove 'Z' if present, use local time as-is)
    const startTimeStr = startTime ? startTime.replace('Z', '').replace('T', ' ').slice(0, 19) : undefined;
    const endTimeStr = endTime ? endTime.replace('Z', '').replace('T', ' ').slice(0, 19) : undefined;

    const updated = await updateShift(tenantId, shiftId, {
      name,
      startTime: startTimeStr as any,
      endTime: endTimeStr as any,
      departmentId,
    });

    if (!updated) {
      return errorResponse("No fields to update", 400);
    }

    const updatedShift = await getShiftById(tenantId, shiftId);
    return successResponse(updatedShift, "Shift updated successfully", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update shift", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const hasPerm = await checkUserPermission(tenantId, employeeId, "delete_shifts");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const shiftId = parseInt(id);
    const shift = await getShiftById(tenantId, shiftId);

    if (!shift) {
      return errorResponse("Shift not found", 404);
    }

    await deleteShift(tenantId, shiftId);

    return successResponse({ id: shiftId }, "Shift deleted successfully", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete shift", 500);
  }
}
