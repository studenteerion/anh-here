import { POST } from '@/app/api/auth/validate/route';
import { NextRequest, NextResponse } from 'next/server';
import * as middleware from '@/lib/middleware';

jest.mock('@/lib/middleware');

describe('POST /api/auth/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks for response functions
    (middleware.authErrorResponse as jest.Mock).mockImplementation((result) => {
      return NextResponse.json(
        { status: 'error', message: result.error || 'Auth error', ...(result.token_expired && { error_code: 'TOKEN_EXPIRED' }) },
        { status: result.status || 401 }
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

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);

    const req = new NextRequest('http://localhost:3000/api/auth/validate', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.status).toBe('error');
    expect(data.message).toBe('Missing or malformed token');
  });

  it('should return 401 when token is expired', async () => {
    const mockAuthResult = {
      error: 'Token expired',
      status: 401,
      token_expired: true,
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);

    const req = new NextRequest('http://localhost:3000/api/auth/validate', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error_code).toBe('TOKEN_EXPIRED');
  });

  it('should return 401 when token is invalid', async () => {
    const mockAuthResult = {
      error: 'Invalid token',
      status: 401,
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);

    const req = new NextRequest('http://localhost:3000/api/auth/validate', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe('Invalid token');
  });

  it('should return 200 and token payload when token is valid', async () => {
    const mockPayload = {
      iss: 'ANH-here',
      sub: 123,
      data: {
        context: 'tenant',
        role_id: 2,
        tenant_id: 10,
      },
      iat: 1620000000,
      exp: 1620000600,
    };

    const mockAuthResult = {
      payload: mockPayload,
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);

    const req = new NextRequest('http://localhost:3000/api/auth/validate', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.message).toBe('Token valid');
    expect(data.data).toEqual(mockPayload);
    expect(data.data.sub).toBe(123);
    expect(data.data.data.tenant_id).toBe(10);
  });

  it('should return 200 with platform token data', async () => {
    const mockPayload = {
      iss: 'ANH-here',
      sub: 1,
      data: {
        context: 'platform',
        role_id: 0,
        tenant_id: 0,
      },
      iat: 1620000000,
      exp: 1620000600,
    };

    const mockAuthResult = {
      payload: mockPayload,
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);

    const req = new NextRequest('http://localhost:3000/api/auth/validate', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.data.context).toBe('platform');
    expect(data.data.data.tenant_id).toBe(0);
  });

  it('should work with Bearer token from Authorization header', async () => {
    const mockPayload = {
      iss: 'ANH-here',
      sub: 123,
      data: {
        context: 'tenant',
        role_id: 2,
        tenant_id: 10,
      },
      iat: 1620000000,
      exp: 1620000600,
    };

    const mockAuthResult = {
      payload: mockPayload,
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);

    const req = new NextRequest('http://localhost:3000/api/auth/validate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test_token_123',
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.sub).toBe(123);
  });
});
