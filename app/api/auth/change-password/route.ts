import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse, getAuthContext } from "@/lib/middleware";
import { checkPassword } from "@/lib/auth";
import { getUserPasswordHash, updateUserPassword } from "@/lib/db/users";
import { getGlobalUserPasswordHash, updateGlobalUserPassword } from "@/lib/db/userAccounts";
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
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change own password
 *     description: User changes their own password with verification of current password
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation failed or passwords don't match
 *       401:
 *         description: Current password is incorrect
 *       404:
 *         description: User account not found
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const authContext = getAuthContext(authResult.payload!);

  try {
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse("Missing required fields: currentPassword, newPassword, confirmPassword", 400);
    }

    if (newPassword !== confirmPassword) {
      return errorResponse("New passwords do not match", 400);
    }

    if (newPassword.length < 8) {
      return errorResponse("New password must be at least 8 characters long", 400);
    }

    if (currentPassword === newPassword) {
      return errorResponse("New password must be different from current password", 400);
    }

    // Verifica la password corrente
    const employeeId = authResult.payload!.sub;
    const tenantId = authResult.payload!.data.tenant_id;
    const currentHash =
      authContext === "platform"
        ? await getGlobalUserPasswordHash(employeeId)
        : await getUserPasswordHash(tenantId, employeeId);
    if (!currentHash) {
      return errorResponse("User account not found", 404);
    }

    if (!checkPassword(currentPassword, currentHash)) {
      return errorResponse("Current password is incorrect", 401);
    }

    // Aggiorna la password
    const newHash = hashPassword(newPassword);
    const updated =
      authContext === "platform"
        ? await updateGlobalUserPassword(employeeId, newHash)
        : await updateUserPassword(tenantId, employeeId, newHash);

    if (!updated) {
      return errorResponse("Failed to update password", 500);
    }

    return successResponse(
      { message: "Password changed successfully" },
      "Your password has been updated",
      200
    );
  } catch (error: unknown) {
    return errorResponse(error instanceof Error ? error.message : "Failed to change password", 500);
  }
}
