import { GET } from '@/app/api/auth/me/route';
import { NextRequest, NextResponse } from 'next/server';
import * as middleware from '@/lib/middleware';
import * as dbUsers from '@/lib/db/users';
import * as dbEmployees from '@/lib/db/employees';
import * as dbRoles from '@/lib/db/roles';
import * as dbDepartments from '@/lib/db/departments';
import * as dbTenants from '@/lib/db/tenants';

jest.mock('@/lib/middleware');
jest.mock('@/lib/db/users');
jest.mock('@/lib/db/employees');
jest.mock('@/lib/db/roles');
jest.mock('@/lib/db/departments');
jest.mock('@/lib/db/tenants');

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks for response functions
    (middleware.verifyTenantAuth as jest.Mock).mockReturnValue({});
    (middleware.authErrorResponse as jest.Mock).mockImplementation((result) => {
      return NextResponse.json(
        { status: 'error', message: result.error || 'Auth error' },
        { status: result.status || 401 }
      );
    });
    (middleware.errorResponse as jest.Mock).mockImplementation((message, status) => {
      return NextResponse.json(
        { status: 'error', message },
        { status }
      );
    });
    (middleware.successResponse as jest.Mock).mockImplementation((data, message, status) => {
      return NextResponse.json(
        { status: 'success', message, data },
        { status }
      );
    });
  });

  it('should return 401 when token is missing', async () => {
    const mockAuthResult = {
      error: 'Missing or malformed token',
      status: 401,
    };

    (middleware.verifyTenantAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    });

    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('should return 404 when user is not found', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    (middleware.verifyTenantAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (dbUsers.getUserById as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    });

    const response = await GET(req);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.message).toBe('User not found');
  });

  it('should return 200 with user data when authenticated', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    const mockUser = {
      employee_id: 123,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role_id: 2,
      last_login: '2024-01-01T10:00:00Z',
    };

    const mockEmployee = {
      employee_id: 123,
      department_id: 5,
      status: 'active',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockRole = {
      id: 2,
      name: 'Manager',
    };

    const mockDepartment = {
      id: 5,
      name: 'Sales',
    };

    const mockTenant = {
      id: 10,
      name: 'Acme Corp',
    };

    (middleware.verifyTenantAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (dbUsers.getUserById as jest.Mock).mockResolvedValueOnce(mockUser);
    (dbEmployees.getEmployeeById as jest.Mock).mockResolvedValueOnce(mockEmployee);
    (dbTenants.getTenantById as jest.Mock).mockResolvedValueOnce(mockTenant);
    (dbRoles.getRoleById as jest.Mock).mockResolvedValueOnce(mockRole);
    (dbDepartments.getDepartmentById as jest.Mock).mockResolvedValueOnce(mockDepartment);

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    });

    const response = await GET(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.data.employeeId).toBe(123);
    expect(data.data.firstName).toBe('John');
    expect(data.data.lastName).toBe('Doe');
    expect(data.data.email).toBe('john@example.com');
    expect(data.data.roleId).toBe(2);
    expect(data.data.roleName).toBe('Manager');
    expect(data.data.departmentId).toBe(5);
    expect(data.data.departmentName).toBe('Sales');
    expect(data.data.tenantName).toBe('Acme Corp');
    expect(data.data.status).toBe('active');
  });

  it('should handle null role and department gracefully', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    const mockUser = {
      employee_id: 123,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      role_id: null,
      last_login: null,
    };

    const mockEmployee = {
      employee_id: 123,
      department_id: null,
      status: 'active',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockTenant = {
      id: 10,
      name: 'Acme Corp',
    };

    (middleware.verifyTenantAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (dbUsers.getUserById as jest.Mock).mockResolvedValueOnce(mockUser);
    (dbEmployees.getEmployeeById as jest.Mock).mockResolvedValueOnce(mockEmployee);
    (dbTenants.getTenantById as jest.Mock).mockResolvedValueOnce(mockTenant);

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    });

    const response = await GET(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.data.roleId).toBeNull();
    expect(data.data.roleName).toBeNull();
    expect(data.data.departmentId).toBeNull();
    expect(data.data.departmentName).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    (middleware.verifyTenantAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (dbUsers.getUserById as jest.Mock).mockRejectedValueOnce(new Error('Database connection error'));

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    });

    const response = await GET(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe('Database connection error');
  });
});
