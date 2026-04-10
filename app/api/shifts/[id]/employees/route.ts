import { NextRequest, NextResponse } from 'next/server';
import { getEmployeesByShift } from '@/lib/db/shifts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shiftId = Number(id);

    if (!shiftId) {
      return NextResponse.json(
        { status: 'error', message: 'Shift ID is required' },
        { status: 400 }
      );
    }

    const employees = await getEmployeesByShift(shiftId);

    return NextResponse.json({
      status: 'success',
      data: {
        employees,
      },
    });
  } catch (error: any) {
    console.error('Error fetching employees for shift:', error);
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
