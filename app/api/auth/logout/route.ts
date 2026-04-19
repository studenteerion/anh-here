import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, getAuthContext } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { deleteTokensByUser } from "@/lib/db/refreshTokens";
import { deletePlatformTokensByUser } from "@/lib/db/platformRefreshTokens";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: |
 *       Logout user and invalidate all refresh tokens.
 *       Clears both access_token and refresh_token cookies.
 *       
 *       The access token is read from the **HttpOnly cookie** automatically.
 *       
 *       **Client Usage**: Use `credentials: 'include'` in fetch to send cookies.
 *       After logout, redirect to /login.
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Cookies are cleared:
 *               - `access_token`: Expired
 *               - `refresh_token`: Expired
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
 *                   example: "Logged out successfully"
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const authContext = getAuthContext(authResult.payload!);

  try {
    if (authContext === "platform") {
      await deletePlatformTokensByUser(authResult.payload!.sub);
    } else {
      const employeeId = authResult.payload!.sub;
      const tenantId = "tenant_id" in authResult.payload!.data ? authResult.payload!.data.tenant_id : 0;

      const hasPerm = await checkUserPermission(tenantId, employeeId, "logout");
      if (!hasPerm) {
        return errorResponse("Permission denied: you don't have access to logout", 403);
      }

      await deleteTokensByUser(tenantId, employeeId);
    }

    const response = NextResponse.json({
      status: "success",
      message: "Logged out successfully"
    });

    // Clear access token cookie
    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    // Clear refresh token cookie
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Expire immediately
    });
    response.cookies.set("tenant_selection_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Server error", 500);
  }
}
