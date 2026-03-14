import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getLeaveRequestById, deleteLeaveRequest, updateLeaveRequestApproval } from "@/lib/db/requests";

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     tags:
 *       - Leave Requests
 *     summary: Get leave request by ID
 *     description: Retrieve a specific leave request details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request retrieved successfully
 *       403:
 *         description: Permission denied or cannot view other users' requests
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags:
 *       - Leave Requests
 *     summary: Cancel leave request
 *     description: Cancel a pending leave request (only the requester can cancel their own requests)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request cancelled successfully
 *       400:
 *         description: Can only delete pending leave requests
 *       403:
 *         description: Can only cancel own leave requests
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Server error
 *   put:
 *     tags:
 *       - Leave Requests
 *     summary: Approve or reject leave request
 *     description: Process a leave request as an approver (approve or reject)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Leave request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Leave request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields or validation failed
 *       403:
 *         description: User is not an approver for this request
 *       404:
 *         description: Leave request not found
 *       500:
 *         description: Server error
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const requestId = parseInt(id);
    const request = await getLeaveRequestById(requestId);

    if (!request) {
      return errorResponse("Leave request not found", 404);
    }

    // Only the requester can cancel their own request, and only if it's still pending
    if (request.employee_id !== employeeId) {
      return errorResponse("You can only cancel your own leave requests", 403);
    }

    const deleted = await deleteLeaveRequest(requestId);

    if (!deleted) {
      return errorResponse("Can only delete pending leave requests", 400);
    }

    return successResponse({ id: requestId }, "Leave request cancelled successfully", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete leave request", 500);
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

    const requestId = parseInt(id);
    const request = await getLeaveRequestById(requestId);

    if (!request) {
      return errorResponse("Leave request not found", 404);
    }

    // Users can see their own requests or if they have permission to see all
    if (request.employee_id !== employeeId) {
      const canSeeAll = await checkUserPermission(employeeId, "user_permissions_read");
      if (!canSeeAll) {
        return errorResponse("You can only view your own leave requests", 403);
      }
    }

    return successResponse(request, "Leave request retrieved", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to retrieve leave request", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return errorResponse("Missing required field: status (approved or rejected)", 400);
    }

    if (!["approved", "rejected"].includes(status)) {
      return errorResponse("Status must be 'approved' or 'rejected'", 400);
    }

    const requestId = parseInt(id);
    const request = await getLeaveRequestById(requestId);
    if (!request) {
      return errorResponse("Leave request not found", 404);
    }

    if (request.approver1_id !== employeeId && request.approver2_id !== employeeId) {
      return errorResponse("You are not an approver for this request", 403);
    }

    const updated = await updateLeaveRequestApproval(requestId, employeeId, status);

    if (!updated) {
      return errorResponse("This approval has already been processed", 400);
    }

    const updatedRequest = await getLeaveRequestById(requestId);
    return successResponse(updatedRequest, `Leave request ${status} successfully`, 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update leave request", 500);
  }
}
