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
 * /api/timesheets/history:
 *   get:
 *     tags:
 *       - Timesheets
 *     summary: Get timesheet history
 *     description: Retrieve attendance history for a specified period with leave requests grouped by date
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
 *         description: History retrieved successfully
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
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalDays:
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

    // Raggruppa presenze per giorno
    const daysByDate: Record<
      string,
      {
        date: string;
        attendances: any[];
        totalHours: number;
        leaves: any[];
      }
    > = {};

    for (const attendance of attendances) {
      const date = new Date(attendance.start_datetime)
        .toISOString()
        .split("T")[0];

      if (!daysByDate[date]) {
        daysByDate[date] = {
          date,
          attendances: [],
          totalHours: 0,
          leaves: [],
        };
      }

      daysByDate[date].attendances.push({
        id: attendance.id,
        checkin: attendance.start_datetime,
        checkout: attendance.end_datetime,
        hours: attendance.end_datetime
          ? await calculateWorkedHours(
              attendance.start_datetime,
              attendance.end_datetime
            )
          : null,
      });

      if (attendance.end_datetime) {
        const hours = await calculateWorkedHours(
          attendance.start_datetime,
          attendance.end_datetime
        );
        daysByDate[date].totalHours += hours;
      }
    }

    // Aggiungi permessi al giorno corrispondente
    for (const leave of leaveRequests) {
      const date = new Date(leave.start_datetime)
        .toISOString()
        .split("T")[0];

      if (!daysByDate[date]) {
        daysByDate[date] = {
          date,
          attendances: [],
          totalHours: 0,
          leaves: [],
        };
      }

      daysByDate[date].leaves.push({
        id: leave.id,
        type: leave.type,
        startDate: leave.start_datetime,
        endDate: leave.end_datetime,
      });
    }

    // Converti in array e ordina
    const history = Object.values(daysByDate)
      .map((day) => ({
        ...day,
        totalHours: parseFloat(day.totalHours.toFixed(2)),
      }))
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    return successResponse({
      period,
      startDate,
      endDate,
      history,
      totalDays: history.length,
    }, undefined, 200);
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
