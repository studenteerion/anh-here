import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/middleware";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getUsersByEmailForLogin } from "@/lib/db/users";
import { storeRefreshToken, deleteTokensByUser } from "@/lib/db/refreshTokens";
import { checkPassword } from "@/lib/auth";
import { updateLastLogin } from "@/lib/db/userAccounts";
import { getPlatformUserByEmail, updatePlatformUserLastLogin } from "@/lib/db/platformUsers";
import { createPlatformRefreshToken } from "@/lib/platformRefreshToken";

const JWT_KEY = process.env.JWT_KEY!;
const TENANT_SELECTION_COOKIE = "tenant_selection_token";
const ACCESS_COOKIE_MAX_AGE = 60 * 10;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login (public)
 *     description: |
 *       Authenticate user with email and password.
 *       Returns access token and refresh token as **HttpOnly cookies** (not in response body).
 *       Tokens are automatically sent by the browser in subsequent requests using `credentials: 'include'`.
 *       
 *       **Security**: Both tokens are HttpOnly, preventing JavaScript access (XSS protection).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "mario@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful or tenant selection required
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Two cookies are set:
 *               - `access_token`: JWT token (HttpOnly, 10 minutes)
 *               - `refresh_token`: Refresh token (HttpOnly, 7 days)
 *             schema:
 *               type: string
 *               example: "access_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=600"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 role:
 *                   type: integer
 *                   description: User role ID
 *                   example: 1
 *                 requiresTenantSelection:
 *                   type: boolean
 *                   example: false
 *                 tenants:
 *                   type: array
 *                   description: Returned only when tenant selection is required
 *                   items:
 *                     type: object
 *                     properties:
 *                       tenantId:
 *                         type: integer
 *                       tenantName:
 *                         type: string
 *                       isDefault:
 *                         type: boolean
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive or no active tenant memberships
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return errorResponse("Missing data", 400);
    }

    const [platformUser, matchingUsers] = await Promise.all([
      getPlatformUserByEmail(email),
      getUsersByEmailForLogin(email),
    ]);

    const platformPasswordValid = Boolean(platformUser && checkPassword(password, platformUser.password_hash));
    const hasTenantEmail = matchingUsers.length > 0;
    const tenantPasswordValid = hasTenantEmail ? checkPassword(password, matchingUsers[0].password_hash) : false;

    if (!platformPasswordValid && !tenantPasswordValid) {
      return errorResponse("Invalid credentials", 401);
    }

    const userRoot = hasTenantEmail ? matchingUsers[0] : null;
    const canUseTenant = Boolean(userRoot && userRoot.global_status === "active");
    const activeMemberships =
      canUseTenant
        ? matchingUsers.filter(
            (candidate) =>
              candidate.membership_status === "active" &&
              candidate.tenant_status === "active" &&
              candidate.employee_status === "active"
          )
        : [];
    const canUsePlatform = Boolean(platformPasswordValid && platformUser?.status === "active");

    if (!canUsePlatform && platformPasswordValid && platformUser?.status !== "active" && !canUseTenant) {
      return errorResponse("Platform account inactive", 403);
    }

    if (!canUseTenant && tenantPasswordValid && userRoot?.global_status !== "active" && !canUsePlatform) {
      return errorResponse("Account inactive", 403);
    }

    if (!canUsePlatform && activeMemberships.length === 0 && tenantPasswordValid) {
      return errorResponse("No active tenant memberships available", 403);
    }

    if (activeMemberships.length === 1 && !canUsePlatform) {
      const selectedMembership = activeMemberships[0];
      const parsedTenantId = Number(selectedMembership.tenant_id);
      await updateLastLogin(parsedTenantId, selectedMembership.employee_id);

      const accessToken = jwt.sign(
        {
          iss: "ANH-here",
          sub: selectedMembership.employee_id,
          data: { context: "tenant", role_id: selectedMembership.role_id, tenant_id: parsedTenantId },
        },
        JWT_KEY,
        { expiresIn: "10m" }
      );

      const refreshToken = crypto.randomBytes(32).toString("hex");
      await deleteTokensByUser(parsedTenantId, selectedMembership.employee_id);
      await storeRefreshToken({
        tenant_id: parsedTenantId,
        global_user_id: selectedMembership.global_user_id,
        employee_id: selectedMembership.employee_id,
        refresh_token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      });

      const response = NextResponse.json({
        status: "success",
        message: "Login successful",
        context: "tenant",
        role: selectedMembership.role_id,
        requiresTenantSelection: false,
        redirectTo: "/dashboard",
      });

      response.cookies.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ACCESS_COOKIE_MAX_AGE,
      });
      response.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: REFRESH_COOKIE_MAX_AGE,
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

    if (canUsePlatform && activeMemberships.length === 0) {
      await updatePlatformUserLastLogin(platformUser!.id);

      const accessToken = jwt.sign(
        {
          iss: "ANH-here",
          sub: platformUser!.id,
          data: {
            context: "platform",
            role_id: 0,
            tenant_id: 0,
          },
        },
        JWT_KEY,
        { expiresIn: "10m" }
      );

      const refreshToken = createPlatformRefreshToken(platformUser!.id);

      const response = NextResponse.json({
        status: "success",
        message: "Login successful",
        context: "platform",
        requiresTenantSelection: false,
        redirectTo: "/platform/dashboard",
      });

      response.cookies.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ACCESS_COOKIE_MAX_AGE,
      });
      response.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: REFRESH_COOKIE_MAX_AGE,
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

    const selectionToken = jwt.sign(
      {
        iss: "ANH-here",
        sub: userRoot?.global_user_id || 0,
        data: {
          purpose: "workspace_selection",
          global_user_id: userRoot?.global_user_id || 0,
          platform_user_id: canUsePlatform ? platformUser!.id : 0,
        },
      },
      JWT_KEY,
      { expiresIn: "10m" }
    );

    const response = NextResponse.json({
      status: "success",
      message: "Tenant selection required",
      context: "tenant",
      requiresTenantSelection: true,
      canAccessPlatform: canUsePlatform,
      tenants: activeMemberships.map((membership) => ({
        tenantId: membership.tenant_id,
        tenantName: membership.tenant_name,
        isDefault: Boolean(membership.is_default),
      })),
    });

    response.cookies.set(TENANT_SELECTION_COOKIE, selectionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });
    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Server error", 500);
  }
}
