import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/middleware";
import crypto from "crypto";
import { findTokenByHash, deleteTokenByHash } from "@/lib/db/refreshTokens";
import { getUserByGlobalIdAndTenant } from "@/lib/db/users";
import { updateGlobalUserLastLogin, updateLastLogin } from "@/lib/db/userAccounts";
import jwt from "jsonwebtoken";
import { getPlatformUserById, updatePlatformUserLastLogin } from "@/lib/db/platformUsers";
import { createPlatformRefreshToken, verifyPlatformRefreshToken } from "@/lib/platformRefreshToken";

const JWT_KEY = process.env.JWT_KEY!;

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token (public)
 *     description: |
 *       Generate a new access token using a valid refresh token.
 *       The refresh token is read from the **HttpOnly cookie** automatically sent by the browser.
 *       Tenant context is resolved from the stored refresh token.
 *       
 *       **Token Rotation**: Each refresh invalidates the old refresh token and issues a new one (rotation for security).
 *       
 *       **Client Usage**: Use `credentials: 'include'` in fetch to send cookies.
 *       
 *       **Fallback**: Can also accept refresh token in request body for compatibility.
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Optional. Refresh token (if not using cookies)
 *                 example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *           examples:
 *             withCookie:
 *               summary: Using cookie (recommended)
 *               value: {}
 *             withBody:
 *               summary: Using request body (fallback)
 *               value:
 *                 refresh_token: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: New tokens issued successfully
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               New cookies are set (token rotation):
 *               - `access_token`: New JWT token (HttpOnly, 10 minutes)
 *               - `refresh_token`: New refresh token (HttpOnly, 7 days)
 *             schema:
 *               type: string
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
 *                   example: "Token refreshed"
 *       400:
 *         description: Missing refresh token
 *       401:
 *         description: Invalid or expired refresh token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookieToken = req.cookies.get("refresh_token")?.value;
    const providedToken = body.refresh_token || cookieToken;

    if (!providedToken) {
      return errorResponse("Missing refresh token", 400);
    }

    const tokenHash = crypto.createHash("sha256").update(providedToken).digest("hex");

    const tenantToken = await findTokenByHash(tokenHash);
    let accessToken: string;
    let newRefreshToken: string;
    let context: "tenant" | "platform";
    let redirectTo: string;

    if (tenantToken) {
      const user = await getUserByGlobalIdAndTenant(tenantToken.global_user_id, tenantToken.tenant_id);
      if (!user) {
        return errorResponse("User not found", 404);
      }

      await updateLastLogin(tenantToken.tenant_id, tenantToken.employee_id);
      await updateGlobalUserLastLogin(tenantToken.global_user_id);
      await deleteTokenByHash(tokenHash, tenantToken.tenant_id);

      accessToken = jwt.sign(
        {
          iss: "ANH-here",
          sub: user.employee_id,
          data: { context: "tenant", role_id: user.role_id, tenant_id: tenantToken.tenant_id },
        },
        JWT_KEY,
        { expiresIn: "10m" }
      );
      context = "tenant";
      redirectTo = "/dashboard";

      newRefreshToken = crypto.randomBytes(32).toString("hex");
      const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
      await import("@/lib/db/refreshTokens").then((m) =>
        m.storeRefreshToken({
          tenant_id: tenantToken.tenant_id,
          global_user_id: tenantToken.global_user_id,
          employee_id: user.employee_id,
          refresh_token: newRefreshTokenHash,
        })
      );
    } else {
      const platformGlobalUserId = verifyPlatformRefreshToken(providedToken);
      if (!platformGlobalUserId) {
        return errorResponse("Invalid or expired token", 401);
      }

      const platformUser = await getPlatformUserById(platformGlobalUserId);
      if (!platformUser || platformUser.status !== "active") {
        return errorResponse("User not found", 404);
      }

      await updatePlatformUserLastLogin(platformUser.id);

      accessToken = jwt.sign(
        {
          iss: "ANH-here",
          sub: platformUser.id,
          data: { context: "platform", role_id: 0, tenant_id: 0 },
        },
        JWT_KEY,
        { expiresIn: "10m" }
      );
      context = "platform";
      redirectTo = "/platform/dashboard";

      newRefreshToken = createPlatformRefreshToken(platformUser.id);
    }

    const response = NextResponse.json({ 
      status: "success",
      message: "Token refreshed",
      context,
      redirectTo,
    });

    // Access token in cookie HttpOnly
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 10, // 10 minuti
    });

    // Refresh token in cookie HttpOnly
    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
    });

    return response;
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
