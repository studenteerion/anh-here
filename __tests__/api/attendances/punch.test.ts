import { POST } from '@/app/api/attendances/punch/route';
import { NextRequest, NextResponse } from 'next/server';
import * as middleware from '@/lib/middleware';
import * as permissions from '@/lib/db/permissions';
import * as attendances from '@/lib/db/attendances';
import pool from '@/lib/db';

jest.mock('@/lib/middleware');
jest.mock('@/lib/db/permissions');
jest.mock('@/lib/db/attendances');
jest.mock('@/lib/db');

describe('POST /api/attendances/punch', () => {
  let mockConnection: {
    beginTransaction: jest.Mock;
    commit: jest.Mock;
    rollback: jest.Mock;
    release: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(true),
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
      release: jest.fn(),
    };

    (pool.getConnection as jest.Mock).mockResolvedValue(mockConnection);
    
    // Setup default mocks for response functions
    (middleware.verifyAuth as jest.Mock).mockReturnValue({});
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

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);

    const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('should return 403 when user does not have clock_in_out permission', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (permissions.checkUserPermission as jest.Mock).mockResolvedValueOnce(false);

    const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.message).toContain('Permission denied');
  });

  it('should return 400 when employee has no shift configured', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (permissions.checkUserPermission as jest.Mock).mockResolvedValueOnce(true);
    (attendances.getEmployeeShift as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe('No shift configured for this employee');
  });

  it('should record checkin successfully when no open attendance exists', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    const mockShift = {
      id: 1,
      name: 'Morning Shift',
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (permissions.checkUserPermission as jest.Mock).mockResolvedValueOnce(true);
    (attendances.getEmployeeShift as jest.Mock).mockResolvedValueOnce(mockShift);
    (attendances.createAttendanceWithConnection as jest.Mock).mockResolvedValueOnce(456);

    const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.message).toBe('Checkin recorded');
    expect(data.data.action).toBe('checkin');
    expect(data.data.attendanceId).toBe(456);
    expect(data.data.shiftName).toBe('Morning Shift');

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
  });

  it('should record checkout successfully when open attendance exists', async () => {
    const checkinTime = new Date('2024-01-15T09:00:00Z');
    const checkoutTime = new Date('2024-01-15T17:30:00Z');

    // Mock current time to checkoutTime
    jest.useFakeTimers();
    jest.setSystemTime(checkoutTime);

    try {
      const mockAuthResult = {
        payload: {
          sub: 123,
          data: {
            tenant_id: 10,
          },
        },
      };

      const mockShift = {
        id: 1,
        name: 'Morning Shift',
      };

      const mockOpenAttendance = {
        id: 456,
        start_datetime: checkinTime,
      };

      (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
      (permissions.checkUserPermission as jest.Mock).mockResolvedValueOnce(true);
      (attendances.getEmployeeShift as jest.Mock).mockResolvedValueOnce(mockShift);
      (attendances.createAttendanceWithConnection as jest.Mock).mockResolvedValueOnce(null);
      (attendances.getOpenAttendanceInTransaction as jest.Mock).mockResolvedValueOnce(mockOpenAttendance);
      (attendances.closeAttendanceWithConnection as jest.Mock).mockResolvedValueOnce(true);

      const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
        method: 'POST',
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('success');
      expect(data.message).toBe('Checkout recorded');
      expect(data.data.action).toBe('checkout');
      expect(data.data.attendanceId).toBe(456);
      expect(parseFloat(data.data.workedHours)).toBeCloseTo(8.5, 0);

      expect(attendances.closeAttendanceWithConnection).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should handle concurrent checkout by retrying checkin', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    const mockShift = {
      id: 1,
      name: 'Morning Shift',
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (permissions.checkUserPermission as jest.Mock).mockResolvedValueOnce(true);
    (attendances.getEmployeeShift as jest.Mock).mockResolvedValueOnce(mockShift);
    (attendances.createAttendanceWithConnection as jest.Mock)
      .mockResolvedValueOnce(null) // First call fails (open attendance exists)
      .mockResolvedValueOnce(789); // Second call succeeds (after rollback)
    (attendances.getOpenAttendanceInTransaction as jest.Mock).mockResolvedValueOnce(null); // Already closed

    const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.message).toBe('Checkin recorded (after concurrent checkout)');
    expect(data.data.action).toBe('checkin');
    expect(mockConnection.rollback).toHaveBeenCalled();
  });

  it('should handle transaction errors gracefully', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    const mockShift = {
      id: 1,
      name: 'Morning Shift',
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (permissions.checkUserPermission as jest.Mock).mockResolvedValueOnce(true);
    (attendances.getEmployeeShift as jest.Mock).mockResolvedValueOnce(mockShift);
    (attendances.createAttendanceWithConnection as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

    const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe('Server error');
    expect(mockConnection.rollback).toHaveBeenCalled();
  });

  it('should always release database connection', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (permissions.checkUserPermission as jest.Mock).mockResolvedValueOnce(true);
    (attendances.getEmployeeShift as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
      method: 'POST',
    });

    await POST(req);
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it('should handle the case when insert still fails after retry', async () => {
    const mockAuthResult = {
      payload: {
        sub: 123,
        data: {
          tenant_id: 10,
        },
      },
    };

    const mockShift = {
      id: 1,
      name: 'Morning Shift',
    };

    (middleware.verifyAuth as jest.Mock).mockReturnValueOnce(mockAuthResult);
    (permissions.checkUserPermission as jest.Mock).mockResolvedValueOnce(true);
    (attendances.getEmployeeShift as jest.Mock).mockResolvedValueOnce(mockShift);
    (attendances.createAttendanceWithConnection as jest.Mock)
      .mockResolvedValueOnce(null) // First call fails
      .mockResolvedValueOnce(null); // Second call also fails
    (attendances.getOpenAttendanceInTransaction as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/attendances/punch', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe('Unable to process punch - please try again');
  });
});
