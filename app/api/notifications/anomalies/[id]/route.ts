import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getAnomalyById, updateAnomaly, deleteAnomaly, closeAnomaly } from "@/lib/db/anomalies";

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
 * /api/notifications/anomalies/{id}/close:
 *   post:
 *     tags:
 *       - Anomalies
 *     summary: Close anomaly
 *     description: Close an open anomaly with resolution notes
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
 *             required:
 *               - resolutionNotes
 *             properties:
 *               resolutionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Anomaly successfully closed
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Anomaly not found
 *       422:
 *         description: Cannot close anomaly in current status
 *       500:
 *         description: Server error
 * /api/notifications/anomalies/{id}/open:
 *   post:
 *     tags:
 *       - Anomalies
 *     summary: Reopen anomaly
 *     description: Reopen a closed or in-progress anomaly
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Anomaly successfully reopened
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Anomaly not found
 *       422:
 *         description: Cannot reopen anomaly in current status
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const anomalyId = parseInt(id);
    const body = await req.json();
    const action = body.action;

    if (action === "close") {
      const hasPerm = await checkUserPermission(employeeId, "resolve_anomalies");
      if (!hasPerm) {
        return errorResponse("Permission denied: you don't have access to this feature", 403);
      }

      const { resolutionNotes } = body;

      if (!resolutionNotes || resolutionNotes.trim() === "") {
        return errorResponse("Missing data: resolutionNotes required", 400);
      }

      const anomaly = await getAnomalyById(anomalyId);
      if (!anomaly) {
        return errorResponse("Anomaly not found", 404);
      }

      if (anomaly.status !== "open") {
        return errorResponse(`Anomaly cannot be closed: it is in status "${anomaly.status}"`, 422);
      }

      if (anomaly.reporter_id === employeeId) {
        return errorResponse("You cannot close an anomaly you reported yourself", 422);
      }

      await closeAnomaly(anomalyId, employeeId, resolutionNotes);

      return successResponse({
        anomalyId,
        status: "closed",
        closedAt: new Date(),
      }, "Anomaly successfully closed", 200);
    } else if (action === "open") {
      const hasPerm = await checkUserPermission(employeeId, "resolve_anomalies");
      if (!hasPerm) {
        return errorResponse("Permission denied: you don't have access to this feature", 403);
      }

      const anomaly = await getAnomalyById(anomalyId);
      if (!anomaly) {
        return errorResponse("Anomaly not found", 404);
      }

      if (anomaly.status === "open") {
        return errorResponse("Anomaly is already open", 400);
      }

      const { description } = body;
      const updated = await updateAnomaly(anomalyId, {
        status: "open",
        description: description || anomaly.description,
      });

      if (!updated) {
        return errorResponse("Failed to reopen anomaly", 400);
      }

      const updatedAnomaly = await getAnomalyById(anomalyId);
      return successResponse(updatedAnomaly, "Anomaly successfully reopened", 200);
    } else {
      return errorResponse("Invalid action. Use 'close' or 'open'", 400);
    }
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
