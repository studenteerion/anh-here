import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import {
  getAttendanceHistory,
  getAttendanceHistoryCount,
  calculateWorkedHours,
} from "@/lib/db/attendances";
import { getLeaveRequestsByDateRange } from "@/lib/db/requests";
import { Attendance } from "@/types/attendances";

/**
 * @swagger
 * /api/attendances/history:
 *   get:
 *     tags:
 *       - Attendances
 *     summary: Get attendance history
 *     description: |
 *       Retrieve attendance history for a specified period with leave requests grouped by date.
 *       Can request own history or other employees' history with proper permissions.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Employee ID to get history for (defaults to authenticated user). Requires view_all_attendances permission if different from authenticated user.
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [today, week, month, all, custom]
 *         default: all
 *         description: Time period to retrieve. If not specified, defaults to "all" (entire history)
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
 *       401:
*         description: Invalid or missing token
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
 *         description: Permission denied or insufficient permissions to view other employee's history
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const authenticatedEmployeeId = authResult.payload!.sub;
  const tenantId = authResult.payload!.data.tenant_id;

  try {
    // Check base permission
    const hasPerm = await checkUserPermission(tenantId, authenticatedEmployeeId, "view_history");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const searchParams = req.nextUrl.searchParams;
    const requestedEmployeeIdParam = searchParams.get("employeeId");
    const requestedEmployeeId = requestedEmployeeIdParam 
      ? parseInt(requestedEmployeeIdParam) 
      : authenticatedEmployeeId;

    // Check access control: if requesting another employee's data, need special permission
    if (requestedEmployeeId !== authenticatedEmployeeId) {
      const hasViewAllPerm = await checkUserPermission(tenantId, authenticatedEmployeeId, "view_all_attendances");
      if (!hasViewAllPerm) {
        return errorResponse("Permission denied: you don't have access to view other employees' attendance history", 403);
      }
    }

  const period = searchParams.get("period") || "all";
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
    } else if (period === "all") {
      // Retrieve all data: set start to year 1900 and end to year 2100
      startDate = new Date(1900, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(2100, 11, 31);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "custom" && fromParam && toParam) {
      startDate = new Date(fromParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      return errorResponse("Invalid period or missing dates", 422);
    }

    // Ottieni permessi approvati nel periodo (una sola volta)
    const leaveRequests = await getLeaveRequestsByDateRange(
      tenantId,
      requestedEmployeeId,
      startDate,
      endDate
    );

    // Gestisci paginazione (coerente con /api/anomalies)
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const hasPagination = pageParam !== null || limitParam !== null;

    let attendances: any[];
    let response: any;

    if (hasPagination) {
      const page = pageParam ? parseInt(pageParam) : 1;
      const limit = limitParam ? parseInt(limitParam) : 50;
      const offset = (page - 1) * limit;

      // Build filters object same as anomalies pattern
      const filters: any = {};
      if (limit && limit > 0) filters.limit = limit;
      if (offset && offset > 0) filters.offset = offset;

      // Ottieni count totale delle attendances
      const totalAttendances = await getAttendanceHistoryCount(
        tenantId,
        requestedEmployeeId,
        startDate,
        endDate
      );
      const totalPages = Math.ceil(totalAttendances / limit) || 1;

      // Valida pagina fuori range
      if (page > totalPages && totalAttendances > 0) {
        return errorResponse(`Page ${page} does not exist. Total pages: ${totalPages}`, 400);
      }

      // Ottieni attendances PAGINATE dal database
      attendances = await getAttendanceHistory(
        tenantId,
        requestedEmployeeId,
        startDate,
        endDate,
        filters
      );

      // Raggruppa le attendances paginate per giorno
      const daysByDate: Record<string, {
        date: string;
        attendances: any[];
        totalHours: number;
        leaves: any[];
      }> = {};

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

        // DB returns a numeric 'hours' field (rounded to 2 decimals) or null for open
        const hours = attendance.hours !== undefined ? Number(attendance.hours) : null;

        daysByDate[date].attendances.push({
          id: attendance.id,
          checkin: attendance.start_datetime,
          checkout: attendance.end_datetime,
          hours,
        });

        if (hours !== null) {
          daysByDate[date].totalHours += hours;
        }
      }

      // Aggiungi permessi ai giorni presenti
      for (const leave of leaveRequests) {
        const date = new Date(leave.start_datetime)
          .toISOString()
          .split("T")[0];

        if (daysByDate[date]) {
          daysByDate[date].leaves.push({
            id: leave.id,
            type: leave.type,
            startDate: leave.start_datetime,
            endDate: leave.end_datetime,
          });
        }
      }

      // Converti in array e ordina per data
      const history = Object.values(daysByDate)
        .map((day) => ({
          ...day,
          totalHours: parseFloat(day.totalHours.toFixed(2)),
        }))
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      response = {
        period,
        startDate,
        endDate,
        history,
        totalDays: history.length,
        pagination: {
          page,
          limit,
          total: totalAttendances,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } else {
      // Nessuna paginazione - ottieni tutto (pass no filters)
      attendances = await getAttendanceHistory(
        tenantId,
        requestedEmployeeId,
        startDate,
        endDate
      );

      // Raggruppa per giorno
      const daysByDate: Record<string, {
        date: string;
        attendances: any[];
        totalHours: number;
        leaves: any[];
      }> = {};

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

        const hours = attendance.hours !== undefined ? Number(attendance.hours) : null;

        daysByDate[date].attendances.push({
          id: attendance.id,
          checkin: attendance.start_datetime,
          checkout: attendance.end_datetime,
          hours,
        });

        if (hours !== null) {
          daysByDate[date].totalHours += hours;
        }
      }

      // Aggiungi permessi
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

      // Converti in array e ordina per data
      const history = Object.values(daysByDate)
        .map((day) => ({
          ...day,
          totalHours: parseFloat(day.totalHours.toFixed(2)),
        }))
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

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
