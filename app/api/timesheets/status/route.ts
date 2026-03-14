import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getOpenAttendance,
  getTodayAttendance,
  calculateWorkedHours,
} from "@/lib/db/timesheets";

/**
 * @swagger
 * /api/timesheets/status:
 *   get:
 *     tags:
 *       - Timesheets
 *     summary: Get current timesheet status
 *     description: Retrieve the current clock-in status and worked hours for the authenticated employee
 *     security:
 *       - BearerAuth: []
 *     responses:
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

    // Ottieni timbro aperto
    const openAttendance = await getOpenAttendance(employeeId);

    // Ottieni tutti i timbri di oggi
    const todayAttendances = await getTodayAttendance(employeeId);

    // Calcola ore lavorate oggi
    let totalHoursToday = 0;
    for (const attendance of todayAttendances) {
      if (attendance.end_datetime) {
        const hours = await calculateWorkedHours(
          attendance.start_datetime,
          attendance.end_datetime
        );
        totalHoursToday += hours;
      }
    }

    // Se c'è un timbro aperto, aggiungi ore fino ad ora
    if (openAttendance) {
      const hoursOpen = await calculateWorkedHours(
        openAttendance.start_datetime,
        new Date()
      );
      totalHoursToday += hoursOpen;
    }

    const lastAttendance =
      todayAttendances.length > 0 ? todayAttendances[0] : null;

    return successResponse({
      clockedIn: openAttendance ? true : false,
      checkinTime: openAttendance ? openAttendance.start_datetime : null,
      hoursWorkedToday: parseFloat(totalHoursToday.toFixed(2)),
      lastCheckout: lastAttendance?.end_datetime || null,
      attendancesToday: todayAttendances.length,
    }, undefined, 200);
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
