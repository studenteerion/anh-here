import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getUserByEmail } from "@/lib/db/users";
import { storeRefreshToken, deleteTokensByUser } from "@/lib/db/refreshTokens";
import { checkPassword } from "@/lib/auth";

const JWT_KEY = process.env.JWT_KEY!;

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login (public)
 *     description: Authenticate user with email and password, returns JWT access token and refresh token.
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
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 token:
 *                   type: string
 *                   description: JWT access token (valid for 10 minutes)
 *                 refresh_token:
 *                   type: string
 *                   description: Refresh token (valid for 7 days)
 *                 role:
 *                   type: integer
 *                 expires_in:
 *                   type: integer
 *                   example: 600
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Missing data", 400);
    }

    const user = await getUserByEmail(email);

    if (!user || !(await checkPassword(password, user.password_hash))) {
      return errorResponse("Invalid credentials", 401);
    }

    const accessToken = jwt.sign(
      {
        iss: "ANH-here",
        sub: user.employee_id,
        data: { role_id: user.role_id },
      },
      JWT_KEY,
      { expiresIn: "10m" }
    );

    const refreshToken = crypto.randomBytes(32).toString("hex");

    // Invalidate previous refresh tokens for this user to avoid multiple valid tokens
    await deleteTokensByUser(user.employee_id);

    await storeRefreshToken({
      user_id: user.employee_id,
      refresh_token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
    });

    const response = NextResponse.json({
      status: "success",
      token: accessToken,
      refresh_token: refreshToken,
      role: user.role_id,
      expires_in: 600,
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      path: "/api/auth/refresh",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return errorResponse("Server error", 500);
  }
}