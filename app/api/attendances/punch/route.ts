import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getOpenAttendance,
  createAttendance,
  closeAttendance,
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

  try {
    // Verifica permesso
    const hasPerm = await checkUserPermission(employeeId, "clock_in_out");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const now = new Date();

    // Cerca se c'è un timbro aperto
    const openAttendance = await getOpenAttendance(employeeId);

    if (openAttendance) {
      // Se esiste, chiudi l'uscita
      await closeAttendance(openAttendance.id, now);

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
    }

    // Se non esiste, crea l'ingresso
    const shift = await getEmployeeShift(employeeId);

    if (!shift) {
      return errorResponse("No shift configured for this employee", 400);
    }

    const attendanceId = await createAttendance(employeeId, shift.id, now);

    return successResponse({
      attendanceId,
      checkinTime: now,
      shiftName: shift.name,
      action: "checkin",
    }, "Checkin recorded", 200);
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
