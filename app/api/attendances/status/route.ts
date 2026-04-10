import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getOpenAttendance,
  getTodayAttendance,
  calculateWorkedHours,
} from "@/lib/db/attendances";

/**
 * @swagger
 * /api/attendances/status:
 *   get:
 *     tags:
 *       - Attendances
 *     summary: Get current attendance status
 *     description: Retrieve the current clock-in status and worked hours for the authenticated employee
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       401:
*         description: Invalid or missing token
*       200:
 *         description: Timesheet status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clockedIn:
 *                   type: boolean
 *                 checkinTime:
 *                   type: string
 *                   format: date-time
 *                 hoursWorkedToday:
 *                   type: number
 *                 lastCheckout:
 *                   type: string
 *                   format: date-time
 *                 attendancesToday:
 *                   type: integer
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    // Verifica permesso
    const hasPerm = await checkUserPermission(employeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    // Ottieni timbro aperto (DB fornisce hours_open)
    const openAttendance = await getOpenAttendance(employeeId);

    // Ottieni tutti i timbri di oggi (DB fornisce "hours" per ciascuna riga)
    const todayAttendances = await getTodayAttendance(employeeId);

    // Somma ore calcolate dal DB
    let totalHoursToday = 0;
    for (const attendance of todayAttendances) {
      if (attendance.hours !== null && attendance.hours !== undefined) {
        totalHoursToday += Number(attendance.hours);
      }
    }

    // Cerca l'ultima uscita (primo record con end_datetime)
    const lastClosedAttendance = todayAttendances.find((att: any) => att.end_datetime);

    return successResponse({
      clockedIn: !!openAttendance,
      checkinTime: openAttendance ? openAttendance.start_datetime : null,
      hoursWorkedToday: parseFloat(totalHoursToday.toFixed(2)),
      lastCheckout: lastClosedAttendance?.end_datetime || null,
      attendancesToday: todayAttendances.length,
    }, undefined, 200);
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
