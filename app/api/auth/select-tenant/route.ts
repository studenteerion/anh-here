import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { errorResponse, successResponse } from "@/lib/middleware";
import { getTenantMembershipByGlobalUserAndTenant, getTenantMembershipsByGlobalUser } from "@/lib/db/tenants";
import { deleteTokensByUser, storeRefreshToken } from "@/lib/db/refreshTokens";
import { updateLastLogin, updateGlobalUserLastLogin } from "@/lib/db/userAccounts";
import { getPlatformUserById, updatePlatformUserLastLogin } from "@/lib/db/platformUsers";
import { deletePlatformTokensByUser, storePlatformRefreshToken } from "@/lib/db/platformRefreshTokens";

const JWT_KEY = process.env.JWT_KEY!;
const TENANT_SELECTION_COOKIE = "tenant_selection_token";

type SelectionPayload = {
  iss: string;
  sub: number;
  data: {
    purpose: string;
    global_user_id?: number;
    platform_user_id?: number;
  };
  iat: number;
  exp: number;
};

function readSelectionPayload(req: NextRequest): SelectionPayload | null {
  const selectionToken = req.cookies.get(TENANT_SELECTION_COOKIE)?.value;
  if (!selectionToken) return null;
  try {
    const payload = jwt.verify(selectionToken, JWT_KEY) as SelectionPayload;
    if (payload.data?.purpose !== "tenant_selection" && payload.data?.purpose !== "workspace_selection") return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * @swagger
 * /api/auth/select-tenant:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get pending tenant choices
 *     description: Returns the active tenant memberships associated with a pending tenant selection token.
 *     security: []
 *     responses:
 *       200:
 *         description: Tenant choices retrieved
 *       401:
 *         description: Missing or invalid tenant selection token
 *       403:
 *         description: No active tenant memberships available
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Complete login by selecting tenant
 *     description: |
 *       Completes the authentication flow after email/password when user belongs to multiple tenants.
 *       Requires a valid tenant selection token cookie from /api/auth/login.
 *     security: []
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
 *                 example: 1
 *     responses:
 *       200:
 *         description: Tenant selected and session established
 *       400:
 *         description: Invalid tenantId
 *       401:
 *         description: Missing or invalid tenant selection token
 *       403:
 *         description: Tenant membership not active
 *       404:
 *         description: Tenant membership not found
 */
export async function GET(req: NextRequest) {
  const payload = readSelectionPayload(req);
  if (!payload) {
    return errorResponse("Tenant selection token missing or invalid", 401);
  }

  const globalUserId = Number(payload.data.global_user_id || payload.sub || 0);
  const platformUserId = Number(payload.data.platform_user_id || 0);
  const memberships = globalUserId > 0 ? await getTenantMembershipsByGlobalUser(globalUserId) : [];
  const activeMemberships = memberships.filter(
    (membership) =>
      membership.membership_status === "active" &&
      membership.tenant_status === "active" &&
      membership.employee_status === "active"
  );
  const canAccessPlatform = platformUserId > 0;

  if (activeMemberships.length === 0 && !canAccessPlatform) {
    return errorResponse("No available workspaces", 403);
  }

  return successResponse(
    {
      canAccessPlatform,
      tenants: activeMemberships.map((membership) => ({
        tenantId: membership.tenant_id,
        tenantName: membership.tenant_name,
        isDefault: Boolean(membership.is_default),
      })),
    },
    "Tenant choices retrieved",
    200
  );
}

export async function POST(req: NextRequest) {
  try {
    const payload = readSelectionPayload(req);
    if (!payload) {
      return errorResponse("Tenant selection token missing or invalid", 401);
    }

    const body = await req.json();
    const context = String(body.context || "tenant");
    const globalUserId = Number(payload.data.global_user_id || payload.sub || 0);
    const platformUserId = Number(payload.data.platform_user_id || 0);

    if (context === "platform") {
      if (platformUserId <= 0) {
        return errorResponse("Platform access not available", 403);
      }

      const platformUser = await getPlatformUserById(platformUserId);
      if (!platformUser || platformUser.status !== "active") {
        return errorResponse("Platform account inactive", 403);
      }

      await updatePlatformUserLastLogin(platformUser.id);

      const accessToken = jwt.sign(
        {
          iss: "ANH-here",
          sub: platformUser.id,
          data: {
            context: "platform",
            role_id: 0,
            tenant_id: 0,
          },
        },
        JWT_KEY,
        { expiresIn: "10m" }
      );

      const refreshToken = crypto.randomBytes(32).toString("hex");
      await deletePlatformTokensByUser(platformUser.id);
      await storePlatformRefreshToken(
        platformUser.id,
        crypto.createHash("sha256").update(refreshToken).digest("hex")
      );

      const response = NextResponse.json({
        status: "success",
        message: "Platform workspace selected successfully",
        context: "platform",
        redirectTo: "/platform/dashboard",
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
      response.cookies.set(TENANT_SELECTION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    const parsedTenantId = Number(body.tenantId);
    if (!Number.isInteger(parsedTenantId) || parsedTenantId <= 0) {
      return errorResponse("Invalid tenantId", 400);
    }

    if (globalUserId <= 0) {
      return errorResponse("Tenant access not available", 403);
    }

    const membership = await getTenantMembershipByGlobalUserAndTenant(globalUserId, parsedTenantId);
    if (!membership) {
      return errorResponse("Tenant membership not found", 404);
    }

    if (
      membership.membership_status !== "active" ||
      membership.tenant_status !== "active" ||
      membership.employee_status !== "active"
    ) {
      return errorResponse("Selected tenant membership is inactive", 403);
    }

    await updateLastLogin(parsedTenantId, membership.employee_id);
    await updateGlobalUserLastLogin(globalUserId);

    const accessToken = jwt.sign(
      {
        iss: "ANH-here",
        sub: membership.employee_id,
        data: { context: "tenant", role_id: membership.role_id, tenant_id: parsedTenantId },
      },
      JWT_KEY,
      { expiresIn: "10m" }
    );

    const refreshToken = crypto.randomBytes(32).toString("hex");
    await deleteTokensByUser(parsedTenantId, membership.employee_id);
    await storeRefreshToken({
      tenant_id: parsedTenantId,
      global_user_id: globalUserId,
      employee_id: membership.employee_id,
      refresh_token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
    });

    const response = NextResponse.json({
      status: "success",
      message: "Tenant selected successfully",
      context: "tenant",
      role: membership.role_id,
      redirectTo: "/dashboard",
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
    response.cookies.set(TENANT_SELECTION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Select tenant error:", error);
    return errorResponse("Server error", 500);
  }
}
