import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authErrorResponse, errorResponse, successResponse, verifyAuth } from "@/lib/middleware";
import { getAuthContext } from "@/lib/middleware";
import { getUserById, getUsersByEmailForLogin } from "@/lib/db/users";
import { getTenantMembershipByGlobalUserAndTenant, getTenantMembershipsByGlobalUser } from "@/lib/db/tenants";
import { deleteTokensByUser, storeRefreshToken } from "@/lib/db/refreshTokens";
import { deletePlatformTokensByUser, storePlatformRefreshToken } from "@/lib/db/platformRefreshTokens";
import { getPlatformUserByEmail, getPlatformUserById, updatePlatformUserLastLogin } from "@/lib/db/platformUsers";
import { updateGlobalUserLastLogin, updateLastLogin } from "@/lib/db/userAccounts";

const JWT_KEY = process.env.JWT_KEY!;

type Workspace = {
  type: "tenant" | "platform";
  tenantId?: number;
  companyName: string;
  isCurrent: boolean;
  isDefault: boolean;
};

function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
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
}

/**
 * @swagger
 * /api/auth/workspaces:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: List available workspaces (tenant/platform) for current session user
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Switch active workspace (tenant/platform) for current session
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const payload = authResult.payload!;
  const context = getAuthContext(payload);
  const workspaces: Workspace[] = [];

  if (context === "tenant") {
    const currentTenantId = payload.data.tenant_id;
    const user = await getUserById(payload.sub, currentTenantId);
    if (!user) return errorResponse("User not found", 404);

    const memberships = await getTenantMembershipsByGlobalUser(user.global_user_id);
    const activeMemberships = memberships.filter(
      (m) => m.membership_status === "active" && m.tenant_status === "active" && m.employee_status === "active"
    );

    workspaces.push(
      ...activeMemberships.map((m) => ({
        type: "tenant" as const,
        tenantId: m.tenant_id,
        companyName: m.tenant_name,
        isCurrent: m.tenant_id === currentTenantId,
        isDefault: Boolean(m.is_default),
      }))
    );

    const platformUser = await getPlatformUserByEmail(user.email);
    if (platformUser && platformUser.status === "active") {
      workspaces.push({
        type: "platform",
        companyName: "Gestione tenant",
        isCurrent: false,
        isDefault: false,
      });
    }
  } else {
    const platformUser = await getPlatformUserById(payload.sub);
    if (!platformUser || platformUser.status !== "active") return errorResponse("Platform user not found", 404);

    workspaces.push({
      type: "platform",
      companyName: "Gestione tenant",
      isCurrent: true,
      isDefault: false,
    });

    const candidates = await getUsersByEmailForLogin(platformUser.email);
    const activeMemberships = candidates.filter(
      (m) =>
        m.global_status === "active" &&
        m.membership_status === "active" &&
        m.tenant_status === "active" &&
        m.employee_status === "active"
    );

    workspaces.push(
      ...activeMemberships.map((m) => ({
        type: "tenant" as const,
        tenantId: m.tenant_id,
        companyName: m.tenant_name,
        isCurrent: false,
        isDefault: Boolean(m.is_default),
      }))
    );
  }

  return successResponse({ currentContext: context, workspaces }, "Workspaces retrieved", 200);
}

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const payload = authResult.payload!;
  const context = getAuthContext(payload);

  try {
    const body = await req.json();
    const targetType = body.type as "tenant" | "platform";
    const targetTenantId = Number(body.tenantId);

    if (targetType !== "tenant" && targetType !== "platform") {
      return errorResponse("Invalid workspace type", 400);
    }

    if (context === "tenant") {
      const currentTenantId = payload.data.tenant_id;
      const currentEmployeeId = payload.sub;
      const user = await getUserById(currentEmployeeId, currentTenantId);
      if (!user) return errorResponse("User not found", 404);

      if (targetType === "platform") {
        const platformUser = await getPlatformUserByEmail(user.email);
        if (!platformUser || platformUser.status !== "active") {
          return errorResponse("Platform workspace not available", 403);
        }

        await deleteTokensByUser(currentTenantId, currentEmployeeId);
        await deletePlatformTokensByUser(platformUser.id);
        await updatePlatformUserLastLogin(platformUser.id);

        const accessToken = jwt.sign(
          {
            iss: "ANH-here",
            sub: platformUser.id,
            data: { context: "platform", role_id: 0, tenant_id: 0 },
          },
          JWT_KEY,
          { expiresIn: "10m" }
        );
        const refreshToken = crypto.randomBytes(32).toString("hex");
        await storePlatformRefreshToken(platformUser.id, crypto.createHash("sha256").update(refreshToken).digest("hex"));

        const response = NextResponse.json({ status: "success", message: "Workspace switched", redirectTo: "/platform/dashboard" });
        setAuthCookies(response, accessToken, refreshToken);
        return response;
      }

      if (!Number.isInteger(targetTenantId) || targetTenantId <= 0) {
        return errorResponse("Invalid tenantId", 400);
      }
      if (targetTenantId === currentTenantId) {
        return successResponse({}, "Workspace already active", 200);
      }

      const targetMembership = await getTenantMembershipByGlobalUserAndTenant(user.global_user_id, targetTenantId);
      if (!targetMembership) return errorResponse("Tenant membership not found", 404);
      if (
        targetMembership.membership_status !== "active" ||
        targetMembership.tenant_status !== "active" ||
        targetMembership.employee_status !== "active"
      ) {
        return errorResponse("Selected tenant membership is inactive", 403);
      }

      await deleteTokensByUser(currentTenantId, currentEmployeeId);
      await deleteTokensByUser(targetTenantId, targetMembership.employee_id);
      await updateLastLogin(targetTenantId, targetMembership.employee_id);
      await updateGlobalUserLastLogin(user.global_user_id);

      const accessToken = jwt.sign(
        {
          iss: "ANH-here",
          sub: targetMembership.employee_id,
          data: { context: "tenant", role_id: targetMembership.role_id, tenant_id: targetTenantId },
        },
        JWT_KEY,
        { expiresIn: "10m" }
      );
      const refreshToken = crypto.randomBytes(32).toString("hex");
      await storeRefreshToken({
        tenant_id: targetTenantId,
        global_user_id: user.global_user_id,
        employee_id: targetMembership.employee_id,
        refresh_token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      });

      const response = NextResponse.json({ status: "success", message: "Workspace switched", redirectTo: "/dashboard" });
      setAuthCookies(response, accessToken, refreshToken);
      return response;
    }

    const platformUser = await getPlatformUserById(payload.sub);
    if (!platformUser || platformUser.status !== "active") return errorResponse("Platform user not found", 404);

    if (targetType === "platform") {
      return successResponse({}, "Workspace already active", 200);
    }

    if (!Number.isInteger(targetTenantId) || targetTenantId <= 0) {
      return errorResponse("Invalid tenantId", 400);
    }

    const candidates = await getUsersByEmailForLogin(platformUser.email);
    const membership = candidates.find(
      (m) =>
        m.tenant_id === targetTenantId &&
        m.global_status === "active" &&
        m.membership_status === "active" &&
        m.tenant_status === "active" &&
        m.employee_status === "active"
    );
    if (!membership) return errorResponse("Tenant membership not found", 404);

    await deletePlatformTokensByUser(platformUser.id);
    await deleteTokensByUser(targetTenantId, membership.employee_id);
    await updateLastLogin(targetTenantId, membership.employee_id);
    await updateGlobalUserLastLogin(membership.global_user_id);

    const accessToken = jwt.sign(
      {
        iss: "ANH-here",
        sub: membership.employee_id,
        data: { context: "tenant", role_id: membership.role_id, tenant_id: targetTenantId },
      },
      JWT_KEY,
      { expiresIn: "10m" }
    );
    const refreshToken = crypto.randomBytes(32).toString("hex");
    await storeRefreshToken({
      tenant_id: targetTenantId,
      global_user_id: membership.global_user_id,
      employee_id: membership.employee_id,
      refresh_token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
    });

    const response = NextResponse.json({ status: "success", message: "Workspace switched", redirectTo: "/dashboard" });
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("Switch workspace error:", error);
    return errorResponse("Server error", 500);
  }
}
