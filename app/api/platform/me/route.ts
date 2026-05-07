import { NextRequest } from "next/server";
import { authErrorResponse, errorResponse, successResponse, verifyPlatformAuth } from "@/lib/middleware";
import { getPlatformUserById } from "@/lib/db/platformUsers";

/**
 * @swagger
 * /api/platform/me:
 *   get:
 *     tags:
 *       - Platform
 *     summary: Get current platform user
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Current platform user retrieved
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Platform token required
 *       404:
 *         description: Platform user not found
 */
export async function GET(req: NextRequest) {
  const authResult = verifyPlatformAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const platformUserId = authResult.payload!.sub;
  const user = await getPlatformUserById(platformUserId);
  if (!user) {
    return errorResponse("Platform user not found", 404);
  }

  return successResponse(
    {
      id: user.id,
      email: user.email,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      fullName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
      status: user.status,
      lastLogin: user.last_login,
    },
    "Current platform user retrieved",
    200
  );
}
