import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getEmployeeShift } from "@/lib/db/attendances";
import {
  getOpenAttendanceBroken,
  createAttendanceBroken,
  closeAttendanceBroken,
} from "@/lib/db/attendancesBroken";

/**
 * BROKEN VERSION - For testing race conditions
 * This endpoint demonstrates what happens WITHOUT proper transaction protection
 * 
 * RACE CONDITION SCENARIO:
 * 1. Request A: Check if open attendance exists → NO
 * 2. Request B: Check if open attendance exists → NO (before A inserts)
 * 3. Request A: Insert new attendance → SUCCESS
 * 4. Request B: Insert new attendance → SUCCESS (DUPLICATE!)
 * 
 * @swagger
 * /api/attendances/punch/broken:
 *   post:
 *     tags:
 *       - Attendances (Testing)
 *     summary: Clock in/out WITHOUT race condition protection
 *     description: BROKEN VERSION - Used to demonstrate race conditions. Do NOT use in production!
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Punch recorded (may create duplicates!)
 *       400:
 *         description: No shift configured
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    // Verifica permesso
    const hasPerm = await checkUserPermission(employeeId, "clock_in_out");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const now = new Date();

    // Get employee shift
    const shift = await getEmployeeShift(employeeId);
    if (!shift) {
      return errorResponse("No shift configured for this employee", 400);
    }

    // RACE CONDITION WINDOW STARTS HERE
    // Check if there's an open attendance
    const openAttendance = await getOpenAttendanceBroken(employeeId);

    if (!openAttendance) {
      // No open attendance - do CHECK-IN
      // PROBLEM: Between the check above and the insert below,
      // another request can also pass the check and create a duplicate!
      
      // Simulate some processing delay to increase race condition window
      // (In real scenario, network latency, DB load, etc. can cause this)
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const attendanceId = await createAttendanceBroken(
        employeeId, 
        shift.id, 
        now
      );

      return successResponse({
        attendanceId,
        checkinTime: now,
        shiftName: shift.name,
        action: "checkin",
      }, "Checkin recorded (BROKEN VERSION - may create duplicates!)", 200);
    }

    // Open attendance exists - do CHECK-OUT
    await closeAttendanceBroken(openAttendance.id, now);

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

  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
