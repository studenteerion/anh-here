import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getLeaveRequestById, deleteLeaveRequest, assignAndUpdateApproval } from "@/lib/db/requests";
import { isValidLeaveRequestStatus } from "@/lib/validation/enums";

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
 *       401:
*         description: Invalid or missing token
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
 *     summary: Approve or reject leave request (with auto-assignment)
 *     description: |
 *       Process a leave request as an approver (approve or reject).
 *       
 *       **Multi-level approval logic:**
 *       - First approver action: automatically assigned to approver1
 *       - Second approver action: automatically assigned to approver2
 *       - Modification window: approvers can change their decision up to 1 day before leave start
 *       
 *       **Example flow:**
 *       1. Employee creates leave request (Jan 15)
 *       2. Manager1 approves (Jan 14, 10:00) → Manager1 becomes approver1
 *       3. Manager2 approves (Jan 14, 11:00) → Manager2 becomes approver2
 *       4. Before Jan 14 24:00: Either manager can change their approval
 *       5. After Jan 14 24:00: Approval decisions are locked
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
 *               properties:
 *                 id:
 *                   type: integer
 *                 employee_id:
 *                   type: integer
 *                 approver1_id:
 *                   type: integer
 *                 approver1_status:
 *                   type: string
 *                 approver1_date:
 *                   type: string
 *                 approver2_id:
 *                   type: integer
 *                 approver2_status:
 *                   type: string
 *                 approver2_date:
 *                   type: string
 *       400:
 *         description: Missing required fields, validation failed, or modification window passed
 *       403:
 *         description: User lacks approve_requests permission
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
    // Check permission to approve/reject requests
    const hasPerm = await checkUserPermission(employeeId, "approve_requests");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to approve requests", 403);
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return errorResponse("Missing required field: status (pending, approved or rejected)", 422);
    }

    if (!isValidLeaveRequestStatus(status)) {
      return errorResponse("Status must be 'pending', 'approved' or 'rejected'", 422);
    }

    const requestId = parseInt(id);
    const request = await getLeaveRequestById(requestId);
    if (!request) {
      return errorResponse("Leave request not found", 404);
    }

    // Use the new auto-assignment function
    const result = await assignAndUpdateApproval(requestId, employeeId, status as "approved" | "rejected");

    if (!result.success) {
      // Determine appropriate HTTP status based on error type
      const statusCode = result.error?.includes("modification window") ? 400 : 403;
      return errorResponse(result.error || "Failed to process approval", statusCode);
    }

    const updatedRequest = result.request;
    return successResponse(updatedRequest, `Leave request ${status} successfully`, 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update leave request", 500);
  }
}
