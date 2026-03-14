import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { createEmployee } from "@/lib/db/employees";
import crypto from "crypto";

const PEPPER = process.env.PEPPER || "";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(12).toString("hex");
  const hashedPassword = crypto
    .createHash("sha256")
    .update(salt + password + PEPPER)
    .digest("hex");
  return salt + hashedPassword;
}

/**
 * @swagger
 * /api/employees/create:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Create new employee
 *     description: Create a new employee account with assigned role and department
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - roleId
 *               - departmentId
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               departmentId:
 *                 type: integer
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 roleId:
 *                   type: integer
 *                 departmentId:
 *                   type: integer
 *                 email:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Permission denied
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const hasPerm = await checkUserPermission(employeeId, "user_permissions_create");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const body = await req.json();
    const { firstName, lastName, roleId, departmentId, email, password } = body;

    if (!firstName || !lastName || !roleId || !departmentId || !email || !password) {
      return errorResponse("Missing required fields: firstName, lastName, roleId, departmentId, email, password", 400);
    }

    const passwordHash = hashPassword(password);
    const newEmployeeId = await createEmployee(firstName, lastName, roleId, departmentId, email, passwordHash);

    return successResponse({
      id: newEmployeeId,
      firstName,
      lastName,
      roleId,
      departmentId,
      email,
    }, "Employee created successfully", 201);
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return errorResponse("Email already exists", 409);
    }
    return errorResponse(error.message || "Failed to create employee", 500);
  }
}
