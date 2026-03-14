import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";

/**
 * @swagger
 * /api/auth/validate:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Validate token
 *     description: Verify that the provided JWT token is valid
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 iss:
 *                   type: string
 *                 sub:
 *                   type: integer
 *                 data:
 *                   type: object
 *       401:
 *         description: Invalid or expired token
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  return successResponse(authResult.payload, "Token valid", 200);
}
