import { NextRequest } from 'next/server';
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from '@/lib/middleware';
import { checkUserPermission } from '@/lib/db/permissions';
import { getRoleById, getEmployeesByRole } from '@/lib/db/roles';
import { countRows } from '@/lib/db/utils';
import { isValidEmployeeStatus, EMPLOYEE_STATUSES } from '@/lib/validation/enums';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    const { id } = await context.params;
    const roleId = parseInt(id);

    const role = await getRoleById(tenantId, roleId);
    if (!role) {
      return errorResponse('Role not found', 404);
    }

    const hasPerm = await checkUserPermission(tenantId, employeeId, 'permissions_read_all');
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const searchParams = req.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const searchFilter = (searchParams.get('search') || '').trim();
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const hasPagination = pageParam || limitParam;
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = (page - 1) * limit;

    if (statusFilter && !isValidEmployeeStatus(statusFilter)) {
      return errorResponse(`Status deve essere uno di: ${EMPLOYEE_STATUSES.join(', ')}`, 400);
    }

    const employees = await getEmployeesByRole(tenantId, roleId, {
      status: statusFilter as 'active' | 'inactive' | undefined,
      search: searchFilter || undefined,
      ...(hasPagination ? { limit, offset } : {}),
    });

    if (hasPagination) {
      let whereClause = 'role_id = ?';
      const params: unknown[] = [roleId];

      if (statusFilter) {
        whereClause += ' AND status = ?';
        params.push(statusFilter);
      }

      if (searchFilter) {
        whereClause += ` AND (
          first_name LIKE ? OR
          last_name LIKE ? OR
          CONCAT(first_name, ' ', last_name) LIKE ? OR
          CAST(id AS CHAR) LIKE ?
        )`;
        const term = `%${searchFilter}%`;
        params.push(term, term, term, term);
      }

      const total = await countRows('employees', tenantId, whereClause, params);
      const totalPages = Math.ceil(total / limit) || 1;

      if (page > totalPages && total > 0) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      return successResponse({
        employees: employees.map((e: unknown) => ({
          id: e.id,
          firstName: e.first_name,
          lastName: e.last_name,
          roleId: e.role_id,
          departmentId: e.department_id,
          status: e.status,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        roleId,
      }, undefined, 200);
    }

    return successResponse({
      employees: employees.map((e: unknown) => ({
        id: e.id,
        firstName: e.first_name,
        lastName: e.last_name,
        roleId: e.role_id,
        departmentId: e.department_id,
        status: e.status,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      })),
      roleId,
    }, undefined, 200);
  } catch (error: unknown) {
    return errorResponse(error.message || 'Server error', 500);
  }
}
