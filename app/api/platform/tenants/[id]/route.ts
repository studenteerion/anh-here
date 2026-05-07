import { NextRequest } from "next/server";
import { authErrorResponse, errorResponse, successResponse, verifyPlatformAuth } from "@/lib/middleware";
import { deleteTenant } from "@/lib/db/tenants";

/**
 * @swagger
 * /api/platform/tenants/{id}:
 *   delete:
 *     tags:
 *       - Platform
 *     summary: Delete a tenant
 *     description: Deletes a tenant by ID (requires platform token)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = verifyPlatformAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  try {
    const { id } = await params;
    const tenantId = parseInt(id, 10);

    if (!tenantId || isNaN(tenantId)) {
      return errorResponse("Invalid tenant ID", 400);
    }

    const deleted = await deleteTenant(tenantId);

    if (!deleted) {
      return errorResponse("Tenant not found", 404);
    }

    return successResponse(
      { tenantId },
      "Tenant deleted successfully",
      200
    );
  } catch (error: unknown) {
    let message = "Failed to delete tenant";
    if (error instanceof Error) {
      console.error('DELETE /api/platform/tenants/[id] error:', error);
      message = error.message;
    } else {
      console.error('DELETE /api/platform/tenants/[id] error:', String(error));
    }
    return errorResponse(message, 500);
  }
}
