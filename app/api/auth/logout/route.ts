import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { deleteTokensByUser } from "@/lib/db/refreshTokens";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: |
 *       Logout user and invalidate all refresh tokens.
 *       The client must also delete the local access token.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
  const employeeId = authResult.payload!.sub;

  try {
    // Check logout permission
    const hasPerm = await checkUserPermission(employeeId, "logout");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to logout", 403);
    }

    // Invalidate all refresh tokens for this user
    await deleteTokensByUser(employeeId);

    // Clear refresh token cookie
    const response = NextResponse.json({
      status: "success",
      message: "Logged out successfully"
    });

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: true,
      path: "/api/auth/refresh",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Server error", 500);
  }
}
