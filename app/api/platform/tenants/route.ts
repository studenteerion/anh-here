import { NextRequest } from "next/server";
import { authErrorResponse, errorResponse, successResponse, verifyPlatformAuth } from "@/lib/middleware";
import { createTenantWithInitialAdmin, getAllTenants } from "@/lib/db/tenants";

/**
 * @swagger
 * /api/platform/tenants:
 *   post:
 *     tags:
 *       - Platform
 *     summary: Create tenant with initial admin user
 *     description: |
 *       Creates a new tenant and its first admin user in a single transaction.
 *       Requires a valid platform token (`context: platform`).
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantName
 *               - adminFirstName
 *               - adminLastName
 *               - adminEmail
 *               - adminPassword
 *             properties:
 *               tenantName:
 *                 type: string
 *                 example: "Nuova Azienda Srl"
 *               adminFirstName:
 *                 type: string
 *                 example: "Mario"
 *               adminLastName:
 *                 type: string
 *                 example: "Rossi"
 *               adminEmail:
 *                 type: string
 *                 format: email
 *                 example: "mario.rossi@example.com"
 *               adminPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "PasswordSicura123!"
 *               departmentName:
 *                 type: string
 *                 example: "Amministrazione"
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or missing token
 *       403:
 *         description: Permission denied
 *       409:
 *         description: Duplicate tenant or conflicting global user password
 */
export async function POST(req: NextRequest) {
  const authResult = verifyPlatformAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  try {
    const body = await req.json();
    const tenantName = String(body.tenantName || "").trim();
    const adminFirstName = String(body.adminFirstName || "").trim();
    const adminLastName = String(body.adminLastName || "").trim();
    const adminEmail = String(body.adminEmail || "").trim().toLowerCase();
    const adminPassword = String(body.adminPassword || "");
    const departmentName = body.departmentName ? String(body.departmentName).trim() : undefined;

    if (!tenantName || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return errorResponse(
        "Missing required fields: tenantName, adminFirstName, adminLastName, adminEmail, adminPassword",
        400
      );
    }

    if (adminPassword.length < 8) {
      return errorResponse("adminPassword must be at least 8 characters long", 400);
    }

    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(adminEmail)) {
      return errorResponse("Invalid email format", 400);
    }

    const result = await createTenantWithInitialAdmin({
      tenantName,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      departmentName,
    });

    return successResponse(
      {
        tenantId: result.tenantId,
        roleId: result.roleId,
        departmentId: result.departmentId,
        employeeId: result.employeeId,
        globalUserId: result.globalUserId,
      },
      "Tenant and initial admin created successfully",
      201
    );
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return errorResponse("Tenant already exists or unique constraint violated", 409);
    }
    if (error?.code === "PASSWORD_MISMATCH") {
      return errorResponse(
        "Global user already exists with a different password. Use the existing password or another email.",
        409
      );
    }
    if (error?.code === "GLOBAL_USER_INACTIVE") {
      return errorResponse("The selected admin email belongs to an inactive global account", 409);
    }
    return errorResponse(error?.message || "Failed to create tenant", 500);
  }
}

export async function GET(req: NextRequest) {
  const authResult = verifyPlatformAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  try {
    const tenants = await getAllTenants();
    return successResponse(
      {
        tenants: tenants.map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })),
      },
      "Tenants retrieved",
      200
    );
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to retrieve tenants", 500);
  }
}
