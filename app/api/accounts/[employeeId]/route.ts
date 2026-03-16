import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getUserAccountByEmployeeId,
  getUserAccountByEmail,
  getUserAccountByEmailExcluding,
  updateUserAccountEmail,
  updateUserAccountPassword,
  deleteUserAccount,
} from "@/lib/db/userAccounts";
import { getEmployeeById } from "@/lib/db/employees";
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
 * /api/accounts/{employeeId}:
 *   get:
 *     tags:
 *       - User Accounts
 *     summary: Get user account by employee ID
 *     description: Retrieve a specific user account. Only accessible to admins with manage_accounts permission.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: User account retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [active, inactive]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 lastLogin:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 *   put:
 *     tags:
 *       - User Accounts
 *     summary: Update user account
 *     description: Update email or password for a user account. Only accessible to admins with manage_accounts permission.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: User account updated successfully
 *       400:
 *         description: Invalid input or email already in use
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags:
 *       - User Accounts
 *     summary: Delete user account
 *     description: |
 *       Delete a user account (access credentials only, employee record remains).
 *       All refresh tokens are invalidated immediately - user cannot access the system.
 *       Only accessible to admins with manage_accounts permission.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       400:
 *         description: Cannot delete own account
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "manage_accounts");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to this feature",
        403
      );
    }

    const { employeeId: targetEmployeeIdStr } = await params;
    const targetEmployeeId = parseInt(targetEmployeeIdStr);

    const account = await getUserAccountByEmployeeId(targetEmployeeId);
    if (!account) {
      return errorResponse("Account not found", 404);
    }

    return successResponse(
      {
        employeeId: account.employee_id,
        email: account.email,
        status: (() => {
          const lastLoginDate = account.last_login ? new Date(account.last_login) : null;
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastLoginDate && lastLoginDate > thirtyDaysAgo ? "active" : "inactive";
        })(),
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        lastLogin: account.last_login,
      },
      "Account retrieved",
      200
    );
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to retrieve account", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "manage_accounts");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to this feature",
        403
      );
    }

    const { employeeId: targetEmployeeIdStr } = await params;
    const targetEmployeeId = parseInt(targetEmployeeIdStr);

    const account = await getUserAccountByEmployeeId(targetEmployeeId);
    if (!account) {
      return errorResponse("Account not found", 404);
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email && !password) {
      return errorResponse(
        "At least one field (email or password) must be provided",
        400
      );
    }

    // Update email if provided
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse("Invalid email format", 400);
      }

      // Check if email already exists for another employee
      const existingAccount = await getUserAccountByEmailExcluding(
        email,
        targetEmployeeId
      );
      if (existingAccount) {
        return errorResponse("Email already in use by another account", 409);
      }

      const emailUpdated = await updateUserAccountEmail(targetEmployeeId, email);
      if (!emailUpdated) {
        return errorResponse("Failed to update email", 500);
      }
    }

    // Update password if provided
    if (password) {
      if (password.length < 8) {
        return errorResponse("Password must be at least 8 characters long", 400);
      }

      const passwordHash = hashPassword(password);
      const passwordUpdated = await updateUserAccountPassword(
        targetEmployeeId,
        passwordHash
      );
      if (!passwordUpdated) {
        return errorResponse("Failed to update password", 500);
      }
    }

    // Fetch updated account
    const updatedAccount = await getUserAccountByEmployeeId(targetEmployeeId);

    return successResponse(
      {
        employeeId: updatedAccount!.employee_id,
        email: updatedAccount!.email,
        status: (() => {
          const lastLoginDate = updatedAccount!.last_login ? new Date(updatedAccount!.last_login) : null;
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastLoginDate && lastLoginDate > thirtyDaysAgo ? "active" : "inactive";
        })(),
        createdAt: updatedAccount!.created_at,
        updatedAt: updatedAccount!.updated_at,
        lastLogin: updatedAccount!.last_login,
      },
      "Account updated successfully",
      200
    );
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to update account", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "manage_accounts");
    if (!hasPerm) {
      return errorResponse(
        "Permission denied: you don't have access to this feature",
        403
      );
    }

    const { employeeId: targetEmployeeIdStr } = await params;
    const targetEmployeeId = parseInt(targetEmployeeIdStr);

    // Prevent admin from deleting their own account
    if (targetEmployeeId === employeeId) {
      return errorResponse(
        "Cannot delete your own account. Contact system administrator.",
        400
      );
    }

    const account = await getUserAccountByEmployeeId(targetEmployeeId);
    if (!account) {
      return errorResponse("Account not found", 404);
    }

    // Verify employee exists
    const employee = await getEmployeeById(targetEmployeeId);
    if (!employee) {
      return errorResponse("Associated employee not found", 404);
    }

    const success = await deleteUserAccount(targetEmployeeId);

    if (!success) {
      return errorResponse("Failed to delete account", 500);
    }

    return successResponse({}, "Account deleted successfully", 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse(error.message || "Failed to delete account", 500);
  }
}
