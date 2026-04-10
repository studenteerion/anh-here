import { NextRequest } from 'next/server';
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from '@/lib/middleware';
import { getUserById } from '@/lib/db/users';
import { getEmployeeById } from '@/lib/db/employees';
import { getUserAccountByEmployeeId } from '@/lib/db/userAccounts';
import { getRoleById } from '@/lib/db/roles';
import { getDepartmentById } from '@/lib/db/departments';

export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const employeeId = authResult.payload!.sub;

  try {
    const [user, employee, account] = await Promise.all([
      getUserById(employeeId),
      getEmployeeById(employeeId),
      getUserAccountByEmployeeId(employeeId),
    ]);

    if (!user || !employee || !account) {
      return errorResponse('User not found', 404);
    }

    // Fetch role and department names
    const [role, department] = await Promise.all([
      user.role_id ? getRoleById(user.role_id) : null,
      employee.department_id ? getDepartmentById(employee.department_id) : null,
    ]);

    return successResponse(
      {
        employeeId,
        firstName: user.first_name,
        lastName: user.last_name,
        email: account.email,
        roleId: user.role_id,
        roleName: role?.name || null,
        departmentId: employee.department_id,
        departmentName: department?.name || null,
        status: employee.status,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at,
        lastLogin: account.last_login,
      },
      'Current user retrieved',
      200
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to retrieve current user', 500);
  }
}
