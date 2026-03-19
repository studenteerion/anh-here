import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import pool from "@/lib/db";
import {
  getOpenAttendanceInTransaction,
  createAttendanceWithConnection,
  closeAttendanceWithConnection,
  getEmployeeShift,
} from "@/lib/db/attendances";

/**
 * @swagger
 * /api/attendances/punch:
 *   post:
 *     tags:
 *       - Attendances
 *     summary: Clock in or clock out
 *     description: Toggle clock in/out status. Creates new attendance if clocked out, closes attendance if clocked in
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Punch recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendanceId:
 *                   type: integer
 *                 checkinTime:
 *                   type: string
 *                   format: date-time
 *                 checkoutTime:
 *                   type: string
 *                   format: date-time
 *                 workedHours:
 *                   type: number
 *                 action:
 *                   type: string
 *                   enum: [checkin, checkout]
 *                 shiftName:
 *                   type: string
 *       400:
 *         description: No shift configured or invalid request
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  // Get a connection from the pool for transaction
  const connection = await pool.getConnection();

  try {
    // Verifica permesso
    const hasPerm = await checkUserPermission(employeeId, "clock_in_out");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const now = new Date();

    // Get employee shift first (before transaction)
    const shift = await getEmployeeShift(employeeId);
    if (!shift) {
      return errorResponse("No shift configured for this employee", 400);
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // ATOMIC OPERATION: Try to insert new attendance
      // This will fail (return null) if an open attendance already exists
      const attendanceId = await createAttendanceWithConnection(
        employeeId, 
        shift.id, 
        now, 
        connection
      );

      if (attendanceId) {
        // INSERT succeeded - this is a CHECK-IN
        await connection.commit();

        return successResponse({
          attendanceId,
          checkinTime: now,
          shiftName: shift.name,
          action: "checkin",
        }, "Checkin recorded", 200);
      }

      // INSERT failed because open attendance exists - do CHECK-OUT
      // Retrieve the existing open attendance
      const openAttendance = await getOpenAttendanceInTransaction(employeeId, connection);

      if (!openAttendance) {
        // This should never happen, but handle it gracefully
        await connection.rollback();
        return errorResponse("Unexpected error: could not find open attendance", 500);
      }

      // Close the attendance
      await closeAttendanceWithConnection(openAttendance.id, now, connection);
      await connection.commit();

      const workedHours = (
        (now.getTime() - new Date(openAttendance.start_datetime).getTime()) /
        (1000 * 60 * 60)
      ).toFixed(2);

      return successResponse({
        attendanceId: openAttendance.id,
        checkinTime: openAttendance.start_datetime,
        checkoutTime: now,
        workedHours: parseFloat(workedHours),
        action: "checkout",
      }, "Checkout recorded", 200);

    } catch (txError) {
      // Rollback on any error within transaction
      await connection.rollback();
      throw txError;
    }
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
}
