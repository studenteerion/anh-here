import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getAttendanceHistory,
  calculateWorkedHours,
} from "@/lib/db/timesheets";
import { getLeaveRequestsByDateRange } from "@/lib/db/requests";
import { Timesheet } from "@/types/timesheets";

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
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (starts at 1). Omit for all results without pagination.
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page. Omit for all results without pagination.
 *     responses:
 *       200:
 *         description: History retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               period: month
 *               startDate: 2024-01-01T00:00:00Z
 *               endDate: 2024-01-31T23:59:59Z
 *               history:
 *                 - date: "2024-01-15"
 *                   attendances:
 *                     - id: 1
 *                       employee_id: 5
 *                       clock_in: 2024-01-15T08:00:00Z
 *                       clock_out: 2024-01-15T17:00:00Z
 *                   totalHours: 9.0
 *                   leaves: []
 *               totalDays: 22
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 22
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
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

    // Handle optional pagination
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const hasPagination = pageParam || limitParam;
    
    let response: any;

    if (hasPagination) {
      const page = pageParam ? parseInt(pageParam) : 1;
      const limit = limitParam ? parseInt(limitParam) : 50;
      const offset = (page - 1) * limit;
      const total = history.length;
      const totalPages = Math.ceil(total / limit) || 1;

      // Valida pagina fuori range
      if (page > totalPages) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      const paginatedHistory = history.slice(offset, offset + limit);

      response = {
        period,
        startDate,
        endDate,
        history: paginatedHistory,
        totalDays: total,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } else {
      response = {
        period,
        startDate,
        endDate,
        history,
        totalDays: history.length,
      };
    }

    return successResponse(response, undefined, 200);
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
