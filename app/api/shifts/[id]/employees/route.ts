import { NextRequest, NextResponse } from 'next/server';
import { getEmployeesByShift } from '@/lib/db/shifts';
import { verifyAuth, authErrorResponse } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = verifyAuth(request);
    if (authResult.error) return authErrorResponse(authResult);
    const tenantId = authResult.payload!.data.tenant_id;

    const { id } = await params;
    const shiftId = Number(id);

    if (!shiftId) {
      return NextResponse.json(
        { status: 'error', message: 'Shift ID is required' },
        { status: 400 }
      );
    }

    const employees = await getEmployeesByShift(tenantId, shiftId);

    return NextResponse.json({
      status: 'success',
      data: {
        employees,
      },
    });
  } catch (error: unknown) {
    let message = 'Internal server error';
    if (error instanceof Error) {
      console.error('Error fetching employees for shift:', error);
      message = error.message;
    } else {
      console.error('Error fetching employees for shift:', String(error));
    }
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    );
  }
}
