import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { updateUserPassword, getUserById } from "@/lib/db/users";
import crypto from "crypto";

const PEPPER = process.env.PEPPER || "";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(12).toString("hex");
  const hashedPassword = crypto
    .createHash("sha256")
    .update(salt + password + PEPPER)
    .digest("hex");
  return salt + hashedPassword;
}

/**
 * @swagger
 * /api/auth/reset-password/{id}:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset user password (admin)
 *     description: Administrator resets password for another user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to reset password for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation failed or invalid request
 *       403:
 *         description: Permission denied - insufficient privileges
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    // Verifica il permesso di admin
    const hasPerm = await checkUserPermission(employeeId, "user_permissions_update");
    if (!hasPerm) {
      return errorResponse("Permission denied: only admins can reset passwords for other users", 403);
    }

    const targetId = parseInt(id);

    if (targetId === employeeId) {
      return errorResponse("Use /api/auth/change-password to change your own password", 400);
    }

    const targetUser = await getUserById(targetId);
    if (!targetUser) {
      return errorResponse("User not found", 404);
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword) {
      return errorResponse("Missing required field: newPassword", 400);
    }

    if (newPassword.length < 8) {
      return errorResponse("New password must be at least 8 characters long", 400);
    }

    // Genera una nuova password
    const newHash = hashPassword(newPassword);
    const updated = await updateUserPassword(targetId, newHash);

    if (!updated) {
      return errorResponse("Failed to reset password", 500);
    }

    return successResponse(
      {
        userId: targetId,
        message: `Password reset for ${targetUser.first_name} ${targetUser.last_name}`,
      },
      "Password reset successfully",
      200
    );
  } catch (error: any) {
    return errorResponse(error.message || "Failed to reset password", 500);
  }
}
