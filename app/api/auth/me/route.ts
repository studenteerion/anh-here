import { NextRequest } from 'next/server';
import { verifyTenantAuth, authErrorResponse, errorResponse, successResponse } from '@/lib/middleware';
import { getUserById } from '@/lib/db/users';
import { getEmployeeById } from '@/lib/db/employees';
import { getRoleById } from '@/lib/db/roles';
import { getDepartmentById } from '@/lib/db/departments';
import { getTenantById } from '@/lib/db/tenants';

export async function GET(req: NextRequest) {
  const authResult = verifyTenantAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const [user, employee, tenant] = await Promise.all([
      getUserById(employeeId, tenantId),
      getEmployeeById(tenantId, employeeId),
      getTenantById(tenantId),
    ]);

    if (!user || !employee) {
      return errorResponse('User not found', 404);
    }

    // Fetch role and department names
    const [role, department] = await Promise.all([
      user.role_id ? getRoleById(tenantId, user.role_id) : null,
      employee.department_id ? getDepartmentById(tenantId, employee.department_id) : null,
    ]);

    return successResponse(
      {
        employeeId,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        roleId: user.role_id,
        roleName: role?.name || null,
        tenantId,
        tenantName: tenant?.name || null,
        departmentId: employee.department_id,
        departmentName: department?.name || null,
        status: employee.status,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at,
        lastLogin: user.last_login,
      },
      'Current user retrieved',
      200
    );
  } catch (error: unknown) {
    let message = 'Failed to retrieve current user';
    if (error instanceof Error) {
      console.error('GET /api/auth/me error:', error);
      message = error.message;
    } else {
      console.error('GET /api/auth/me error:', String(error));
    }
    return errorResponse(message, 500);
  }
}
