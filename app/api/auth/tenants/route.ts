import { NextRequest, NextResponse } from "next/server";
import { sign } from '@/lib/jwt';
import crypto from "crypto";
import { verifyTenantAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { getUserById } from "@/lib/db/users";
import { getTenantMembershipByGlobalUserAndTenant, getTenantMembershipsByGlobalUser } from "@/lib/db/tenants";
import { deleteTokensByUser, storeRefreshToken } from "@/lib/db/refreshTokens";
import { updateGlobalUserLastLogin, updateLastLogin } from "@/lib/db/userAccounts";

const JWT_KEY = process.env.JWT_KEY!;

/**
 * @swagger
 * /api/auth/tenants:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: List available tenant memberships for current user
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Tenant memberships retrieved
 *       401:
 *         description: Invalid or missing token
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Switch active tenant for current session
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *             properties:
 *               tenantId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Tenant switched
 *       400:
 *         description: Invalid tenantId
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Tenant membership inactive
 *       404:
 *         description: Tenant membership not found
 */
export async function GET(req: NextRequest) {
  const authResult = verifyTenantAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const employeeId = authResult.payload!.sub;
  const currentTenantId = authResult.payload!.data.tenant_id;

  const user = await getUserById(employeeId, currentTenantId);
  if (!user) {
    return errorResponse("User not found", 404);
  }

  const memberships = await getTenantMembershipsByGlobalUser(user.global_user_id);
  const activeMemberships = memberships.filter(
    (membership) =>
      membership.membership_status === "active" &&
      membership.tenant_status === "active" &&
      membership.employee_status === "active"
  );

  return successResponse(
    {
      currentTenantId,
      companies: activeMemberships.map((membership) => ({
        tenantId: membership.tenant_id,
        companyName: membership.tenant_name,
        isDefault: Boolean(membership.is_default),
        isCurrent: membership.tenant_id === currentTenantId,
      })),
    },
    "Tenant memberships retrieved",
    200
  );
}

export async function POST(req: NextRequest) {
  const authResult = verifyTenantAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const currentEmployeeId = authResult.payload!.sub;
  const currentTenantId = authResult.payload!.data.tenant_id;

  try {
    const body = await req.json();
    const tenantId = Number(body.tenantId);

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      return errorResponse("Invalid tenantId", 400);
    }

    if (tenantId === currentTenantId) {
      return successResponse({}, "Tenant already active", 200);
    }

    const user = await getUserById(currentEmployeeId, currentTenantId);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const targetMembership = await getTenantMembershipByGlobalUserAndTenant(user.global_user_id, tenantId);
    if (!targetMembership) {
      return errorResponse("Tenant membership not found", 404);
    }

    if (
      targetMembership.membership_status !== "active" ||
      targetMembership.tenant_status !== "active" ||
      targetMembership.employee_status !== "active"
    ) {
      return errorResponse("Selected tenant membership is inactive", 403);
    }

    await deleteTokensByUser(currentTenantId, currentEmployeeId);
    await deleteTokensByUser(tenantId, targetMembership.employee_id);

    await updateLastLogin(tenantId, targetMembership.employee_id);
    await updateGlobalUserLastLogin(user.global_user_id);

    const accessToken = sign(
      {
        iss: "ANH-here",
        sub: targetMembership.employee_id,
        data: { context: "tenant", role_id: targetMembership.role_id, tenant_id: tenantId },
      },
      JWT_KEY,
      { expiresIn: "10m" }
    );

    const refreshToken = crypto.randomBytes(32).toString("hex");
    await storeRefreshToken({
      tenant_id: tenantId,
      global_user_id: user.global_user_id,
      employee_id: targetMembership.employee_id,
      refresh_token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
    });

    const response = NextResponse.json({
      status: "success",
      message: "Tenant switched successfully",
    });

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("tenant_selection_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Switch tenant error:", error);
    return errorResponse("Server error", 500);
  }
}
