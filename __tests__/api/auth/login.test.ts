import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';
import * as jwt from '@/lib/jwt';
import * as db from '@/lib/db/users';
import * as dbPlatform from '@/lib/db/platformUsers';
import * as dbRefresh from '@/lib/db/refreshTokens';
import * as dbAccounts from '@/lib/db/userAccounts';
import * as auth from '@/lib/auth';

jest.mock('@/lib/jwt');
jest.mock('@/lib/db/users');
jest.mock('@/lib/db/platformUsers');
jest.mock('@/lib/db/refreshTokens');
jest.mock('@/lib/db/userAccounts');
jest.mock('@/lib/auth');

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email or password is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe('Missing data');
  });

  it('should return 401 if credentials are invalid', async () => {
    const email = 'test@example.com';
    const password = 'wrong_password';

    (dbPlatform.getPlatformUserByEmail as jest.Mock).mockResolvedValueOnce(null);
    (db.getUsersByEmailForLogin as jest.Mock).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe('Invalid credentials');
  });

  it('should return 403 if account is inactive', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const mockUser = {
      employee_id: 1,
      global_user_id: 1,
      global_status: 'inactive',
      password_hash: 'hash',
    };

    (dbPlatform.getPlatformUserByEmail as jest.Mock).mockResolvedValueOnce(null);
    (db.getUsersByEmailForLogin as jest.Mock).mockResolvedValueOnce([mockUser]);
    (auth.checkPassword as jest.Mock).mockReturnValueOnce(true);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.message).toBe('Account inactive');
  });

  it('should login successfully with single active tenant membership', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const mockUser = {
      employee_id: 1,
      global_user_id: 1,
      global_status: 'active',
      membership_status: 'active',
      tenant_status: 'active',
      employee_status: 'active',
      role_id: 2,
      tenant_id: 10,
      password_hash: 'hash',
    };

    (dbPlatform.getPlatformUserByEmail as jest.Mock).mockResolvedValueOnce(null);
    (db.getUsersByEmailForLogin as jest.Mock).mockResolvedValueOnce([mockUser]);
    (auth.checkPassword as jest.Mock).mockReturnValueOnce(true);
    (jwt.sign as jest.Mock).mockReturnValueOnce('test_jwt_token');
    (dbAccounts.updateLastLogin as jest.Mock).mockResolvedValueOnce(true);
    (dbRefresh.deleteTokensByUser as jest.Mock).mockResolvedValueOnce(true);
    (dbRefresh.storeRefreshToken as jest.Mock).mockResolvedValueOnce(true);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.message).toBe('Login successful');
    expect(data.requiresTenantSelection).toBe(false);
    expect(data.role).toBe(2);

    expect(response.cookies.has('access_token')).toBe(true);
    expect(response.cookies.has('refresh_token')).toBe(true);
  });

  it('should return tenant selection when multiple active memberships exist', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const mockUsers = [
      {
        employee_id: 1,
        global_user_id: 1,
        global_status: 'active',
        membership_status: 'active',
        tenant_status: 'active',
        employee_status: 'active',
        role_id: 2,
        tenant_id: 10,
        tenant_name: 'Tenant A',
        is_default: false,
        password_hash: 'hash',
      },
      {
        employee_id: 2,
        global_user_id: 1,
        global_status: 'active',
        membership_status: 'active',
        tenant_status: 'active',
        employee_status: 'active',
        role_id: 3,
        tenant_id: 20,
        tenant_name: 'Tenant B',
        is_default: true,
        password_hash: 'hash',
      },
    ];

    (dbPlatform.getPlatformUserByEmail as jest.Mock).mockResolvedValueOnce(null);
    (db.getUsersByEmailForLogin as jest.Mock).mockResolvedValueOnce(mockUsers);
    (auth.checkPassword as jest.Mock).mockReturnValueOnce(true);
    (jwt.sign as jest.Mock).mockReturnValueOnce('test_selection_token');

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.requiresTenantSelection).toBe(true);
    expect(data.tenants).toHaveLength(2);
    expect(data.tenants[0].tenantName).toBe('Tenant A');
    expect(data.tenants[1].tenantName).toBe('Tenant B');
  });

  it('should handle platform user login successfully', async () => {
    const email = 'admin@platform.com';
    const password = 'password123';

    const mockPlatformUser = {
      id: 1,
      status: 'active',
      password_hash: 'hash',
    };

    (dbPlatform.getPlatformUserByEmail as jest.Mock).mockResolvedValueOnce(mockPlatformUser);
    (db.getUsersByEmailForLogin as jest.Mock).mockResolvedValueOnce([]);
    (auth.checkPassword as jest.Mock).mockReturnValueOnce(true);
    (jwt.sign as jest.Mock).mockReturnValueOnce('test_jwt_token');
    (dbPlatform.updatePlatformUserLastLogin as jest.Mock).mockResolvedValueOnce(true);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.context).toBe('platform');
    expect(data.requiresTenantSelection).toBe(false);
  });

  it('should handle server errors gracefully', async () => {
    (dbPlatform.getPlatformUserByEmail as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe('Server error');
  });
});
