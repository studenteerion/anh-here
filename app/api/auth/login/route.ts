import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getUserByEmail } from "@/lib/db/users";
import { storeRefreshToken, deleteTokensByUser } from "@/lib/db/refreshTokens";
import { checkPassword } from "@/lib/auth";
import { updateLastLogin } from "@/lib/db/userAccounts";

const JWT_KEY = process.env.JWT_KEY!;

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
 *         description: Login successful
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

    // Update last login timestamp
    await updateLastLogin(user.employee_id);

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
      message: "Login successful",
      role: user.role_id,
    });

    // Access token in cookie HttpOnly (sicuro!)
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 10, // 10 minuti
    });

    // Refresh token in cookie HttpOnly
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Server error", 500);
  }
}