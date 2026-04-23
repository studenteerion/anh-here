import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAnomalyById, updateAnomaly, deleteAnomaly } from "@/lib/db/anomalies";
import { isValidAnomalyStatus, ANOMALY_STATUSES } from "@/lib/validation/enums";

/**
 * @swagger
 * /api/anomalies/{id}:
 *   get:
 *     tags:
 *       - Anomalies
 *     summary: Get anomaly by ID
 *     description: Retrieve a specific anomaly details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anomaly ID
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Anomaly retrieved successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Anomaly not found
 *       500:
 *         description: Server error
 *   put:
 *     tags:
 *       - Anomalies
 *     summary: Update anomaly
 *     description: |
 *       Update anomaly status, description, and/or resolution notes.
 *       Status can be: open, in_progress, closed.
 *       When closing an anomaly, resolver_id and resolved_at are automatically set.
 *       
 *       Examples:
 *       - Close anomaly with notes: {"status": "closed", "resolutionNotes": "Issue resolved"}
 *       - Update resolution notes: {"resolutionNotes": "Additional notes"}
 *       - Reopen anomaly: {"status": "open"}
 *       - Update description: {"description": "New description"}
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anomaly ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, closed]
 *                 description: New status for the anomaly (optional)
 *               description:
 *                 type: string
 *                 description: Updated description (optional)
 *               resolutionNotes:
 *                 type: string
 *                 description: Resolution notes/comments (optional)
 *     responses:
 *       200:
 *         description: Anomaly updated successfully
 *       400:
 *         description: Bad request
 *       422:
 *         description: Validation failed (invalid status, no fields to update, invalid transition)
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Anomaly not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags:
 *       - Anomalies
 *     summary: Delete anomaly
 *     description: Delete a specific anomaly
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anomaly ID
 *     responses:
 *       200:
 *         description: Anomaly deleted successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Anomaly not found
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
    const hasPerm = await checkUserPermission(tenantId, employeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const anomalyId = parseInt(id);
    const anomaly = await getAnomalyById(tenantId, anomalyId);

    if (!anomaly) {
      return errorResponse("Anomaly not found", 404);
    }

    // Check ownership: only allow viewing if anomaly belongs to user OR user is admin with permission
    if (anomaly.employee_id !== employeeId) {
      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
      if (!hasAdminPerm) {
        return errorResponse("Permission denied: you can only view your own anomalies", 403);
      }
    }

    return successResponse(anomaly, "Anomaly retrieved", 200);
  } catch (error: unknown) {
    let message = "Failed to retrieve anomaly";
    if (error instanceof Error) {
      console.error('GET /api/anomalies/[id] error:', error);
      message = error.message;
    } else {
      console.error('GET /api/anomalies/[id] error:', String(error));
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
    const hasPerm = await checkUserPermission(tenantId, employeeId, "resolve_anomalies");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const anomalyId = parseInt(id);
    const anomaly = await getAnomalyById(tenantId, anomalyId);

    if (!anomaly) {
      return errorResponse("Anomaly not found", 404);
    }

    // Only allow modification if anomaly belongs to user OR user is admin
    if (anomaly.employee_id !== employeeId) {
      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
      if (!hasAdminPerm) {
        return errorResponse("Permission denied: you can only modify your own anomalies", 403);
      }
    }

    const body = await req.json();
    const { description, status, resolutionNotes } = body;

    if (!description && !status && resolutionNotes === undefined) {
      return errorResponse("At least one field to update required: description, status, or resolutionNotes", 422);
    }

    if (status && !isValidAnomalyStatus(status)) {
      return errorResponse(`Status deve essere uno di: ${ANOMALY_STATUSES.join(", ")}`, 422);
    }

    // Validate status transitions
    if (status) {
      if (status === "closed" && anomaly.status !== "open") {
        return errorResponse(`Cannot close anomaly: it is in status "${anomaly.status}"`, 422);
      }
      if (status === "open" && anomaly.status === "open") {
        return errorResponse("Anomaly is already open", 422);
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (description !== undefined) {
      updateData.description = description;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (resolutionNotes !== undefined) {
      updateData.resolutionNotes = resolutionNotes;
    }

    // If closing, set resolver and resolved_at
    if (status === "closed") {
      updateData.resolvedAt = new Date();
      updateData.resolverId = employeeId;
    }

    const updated = await updateAnomaly(tenantId, anomalyId, updateData);

    if (!updated) {
      return errorResponse("Failed to update anomaly", 422);
    }

    const updatedAnomaly = await getAnomalyById(tenantId, anomalyId);
    return successResponse(updatedAnomaly, "Anomaly updated successfully", 200);
  } catch (error: unknown) {
    let message = "Failed to update anomaly";
    if (error instanceof Error) {
      console.error('PUT /api/anomalies/[id] error:', error);
      message = error.message;
    } else {
      console.error('PUT /api/anomalies/[id] error:', String(error));
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
    const hasPerm = await checkUserPermission(tenantId, employeeId, "resolve_anomalies");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const anomalyId = parseInt(id);
    const anomaly = await getAnomalyById(tenantId, anomalyId);

    if (!anomaly) {
      return errorResponse("Anomaly not found", 404);
    }

    // Only allow deletion if anomaly belongs to user OR user is admin
    if (anomaly.employee_id !== employeeId) {
      const hasAdminPerm = await checkUserPermission(tenantId, employeeId, "user_permissions_read");
      if (!hasAdminPerm) {
        return errorResponse("Permission denied: you can only delete your own anomalies", 403);
      }
    }

    await deleteAnomaly(tenantId, anomalyId);

    return successResponse({ id: anomalyId }, "Anomaly deleted successfully", 200);
  } catch (error: unknown) {
    let message = "Failed to delete anomaly";
    if (error instanceof Error) {
      console.error('DELETE /api/anomalies/[id] error:', error);
      message = error.message;
    } else {
      console.error('DELETE /api/anomalies/[id] error:', String(error));
    }
    return errorResponse(message, 500);
  }
}
