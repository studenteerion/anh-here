import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAnomalyById, updateAnomaly, deleteAnomaly } from "@/lib/db/anomalies";

/**
 * @swagger
 * /api/notifications/anomalies/{id}:
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
 *     description: Update anomaly description and/or status
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
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, closed]
 *     responses:
 *       200:
 *         description: Anomaly updated successfully
 *       400:
 *         description: Validation failed or no fields to update
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
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "resolve_anomalies");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const anomalyId = parseInt(id);
    const anomaly = await getAnomalyById(anomalyId);

    if (!anomaly) {
      return errorResponse("Anomaly not found", 404);
    }

    const body = await req.json();
    const { description, status } = body;

    if (!description && !status) {
      return errorResponse("At least one field to update required: description or status", 400);
    }

    if (status && !["open", "in_progress", "closed"].includes(status)) {
      return errorResponse("Status must be one of: open, in_progress, closed", 400);
    }

    const updated = await updateAnomaly(anomalyId, { description, status });

    if (!updated) {
      return errorResponse("Failed to update anomaly", 400);
    }

    const updatedAnomaly = await getAnomalyById(anomalyId);
    return successResponse(updatedAnomaly, "Anomaly updated successfully", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update anomaly", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "resolve_anomalies");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const anomalyId = parseInt(id);
    const anomaly = await getAnomalyById(anomalyId);

    if (!anomaly) {
      return errorResponse("Anomaly not found", 404);
    }

    await deleteAnomaly(anomalyId);

    return successResponse({ id: anomalyId }, "Anomaly deleted successfully", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete anomaly", 500);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const anomalyId = parseInt(id);
    const anomaly = await getAnomalyById(anomalyId);

    if (!anomaly) {
      return errorResponse("Anomaly not found", 404);
    }

    return successResponse(anomaly, "Anomaly retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve anomaly", 500);
  }
}
