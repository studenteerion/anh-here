import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getLeaveRequestById, updateLeaveRequestApproval } from "@/lib/db/requests";

/**
 * @swagger
 * /api/requests/update:
 *   post:
 *     tags:
 *       - Leave Requests
 *     summary: Approve or reject leave request
 *     description: Process a leave request as an approver (approve or reject)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *               - status
 *             properties:
 *               requestId:
 *                 type: integer
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
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const body = await req.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return errorResponse("Missing required fields: requestId, status (approved or rejected)", 400);
    }

    if (!["approved", "rejected"].includes(status)) {
      return errorResponse("Status must be 'approved' or 'rejected'", 400);
    }

    const request = await getLeaveRequestById(requestId);
    if (!request) {
      return errorResponse("Leave request not found", 404);
    }

    // Verifica se l'utente è un approvatore
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
