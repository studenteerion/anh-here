import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";

/**
 * @swagger
 * /api/auth/validate:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Validate token
 *     description: |
 *       Verify that the provided JWT token is valid.
 *       The token is read from the **HttpOnly cookie** automatically.
 *       
 *       **Client Usage**: Use `credentials: 'include'` in fetch to send cookies.
 *       
 *       **Fallback**: Can also read from Authorization header (Bearer token) for API compatibility.
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                   example: "Token valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     iss:
 *                       type: string
 *                       example: "ANH-here"
 *                     sub:
 *                       type: integer
 *                       description: User employee_id
 *                       example: 123
 *                     data:
 *                       type: object
 *                       properties:
 *                         role_id:
 *                           type: integer
 *                           example: 1
 *                     iat:
 *                       type: integer
 *                       description: Issued at timestamp
 *                     exp:
 *                       type: integer
 *                       description: Expiration timestamp
 *       401:
 *         description: Invalid or expired token
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  return successResponse(authResult.payload, "Token valid", 200);
}
