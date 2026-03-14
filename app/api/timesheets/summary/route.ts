import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getAttendanceHistory,
  calculateWorkedHours,
} from "@/lib/db/timesheets";
import { getLeaveRequestsByDateRange } from "@/lib/db/requests";

/**
 * @swagger
 * /api/timesheets/summary:
 *   get:
 *     tags:
 *       - Timesheets
 *     summary: Get timesheet summary
 *     description: Retrieve worked hours, days worked, and leave statistics for a specified period
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [today, week, month, custom]
 *         default: month
 *         description: Time period to retrieve
 *       - name: from
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period (required if period=custom)
 *       - name: to
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period (required if period=custom)
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 totalWorkedHours:
 *                   type: number
 *                 daysWorked:
 *                   type: integer
 *                 totalLeaveDays:
 *                   type: number
 *                 leaveByType:
 *                   type: object
 *                 attendanceCount:
 *                   type: integer
 *       400:
 *         description: Invalid period or missing dates
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

    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "month";
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Calcola date in base al periodo
    let startDate = new Date();
    let endDate = new Date();

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "week") {
      const curr = new Date();
      const first = curr.getDate() - curr.getDay();
      startDate = new Date(curr.setDate(first));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      );
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "custom" && fromParam && toParam) {
      startDate = new Date(fromParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      return errorResponse("Invalid period or missing dates", 400);
    }

    // Ottieni presenze nel periodo
    const attendances = await getAttendanceHistory(
      employeeId,
      startDate,
      endDate
    );

    // Ottieni permessi approvati nel periodo
    const leaveRequests = await getLeaveRequestsByDateRange(
      employeeId,
      startDate,
      endDate
    );

    // Calcola statistiche
    let totalWorkedHours = 0;
    let daysWorked = 0;
    const uniqueDays = new Set<string>();

    for (const attendance of attendances) {
      const day = new Date(attendance.start_datetime)
        .toISOString()
        .split("T")[0];
      uniqueDays.add(day);

      if (attendance.end_datetime) {
        const hours = await calculateWorkedHours(
          attendance.start_datetime,
          attendance.end_datetime
        );
        totalWorkedHours += hours;
      }
    }

    daysWorked = uniqueDays.size;

    // Calcola giorni di permesso
    let totalLeaveDays = 0;
    const leaveByType: Record<string, number> = {
      sick: 0,
      vacation: 0,
      personal: 0,
      other: 0,
    };

    for (const leave of leaveRequests) {
      const days =
        (new Date(leave.end_datetime).getTime() -
          new Date(leave.start_datetime).getTime()) /
        (1000 * 60 * 60 * 24);
      totalLeaveDays += days;
      leaveByType[leave.type] += days;
    }

    return successResponse({
      period,
      startDate,
      endDate,
      totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
      daysWorked,
      totalLeaveDays: parseFloat(totalLeaveDays.toFixed(2)),
      leaveByType,
      attendanceCount: attendances.length,
    }, undefined, 200);
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
