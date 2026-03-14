import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { getOpenAnomalies, getEmployeeOpenAnomalies } from "@/lib/db/anomalies";

export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");
    const filter = searchParams.get("filter");
    const userId = searchParams.get("userId");

    // Caso 1: Nessun filtro/userId → le mie anomalie aperte (tutti gli utenti)
    if (!filter && !userId) {
      const anomalies = await getEmployeeOpenAnomalies(employeeId, limit);
      return successResponse({
        anomalies: anomalies.map((a: any) => ({
          id: a.id,
          description: a.description,
          status: a.status,
          reportedAt: a.created_at,
          reporterId: a.reporter_id,
          resolutionNotes: a.resolution_notes,
        })),
        totalOpen: anomalies.length,
        scope: "my_anomalies",
      }, undefined, 200);
    }

    // Per i casi 2 e 3, verifica permesso resolve_anomalies
    const hasPerm = await checkUserPermission(employeeId, "resolve_anomalies");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    // Caso 2: filter=all → tutte le anomalie aperte del sistema
    if (filter === "all") {
      const anomalies = await getOpenAnomalies(limit);
      return successResponse({
        anomalies: anomalies.map((a: any) => ({
          id: a.id,
          description: a.description,
          status: a.status,
          reportedAt: a.created_at,
          reporterId: a.reporter_id,
          resolutionNotes: a.resolution_notes,
        })),
        totalOpen: anomalies.length,
        scope: "all_system_anomalies",
      }, undefined, 200);
    }

    // Caso 3: userId specificato → anomalie aperte di quell'utente
    if (userId) {
      const targetUserId = parseInt(userId);
      if (isNaN(targetUserId)) {
        return errorResponse("userId must be a valid number", 400);
      }

      const anomalies = await getEmployeeOpenAnomalies(targetUserId, limit);
      return successResponse({
        anomalies: anomalies.map((a: any) => ({
          id: a.id,
          description: a.description,
          status: a.status,
          reportedAt: a.created_at,
          reporterId: a.reporter_id,
          resolutionNotes: a.resolution_notes,
        })),
        totalOpen: anomalies.length,
        scope: "user_anomalies",
        userId: targetUserId,
      }, undefined, 200);
    }

    return errorResponse("Invalid parameters", 400);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
