import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { closeAnomaly, getAnomalyById } from "@/lib/db/anomalies";

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const resolverId = authResult.payload!.sub;

  try {
    // Verifica permesso
    const hasPerm = await checkUserPermission(resolverId, "resolve_anomalies");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const body = await req.json();
    const { anomalyId, resolutionNotes } = body;

    if (!anomalyId) {
      return errorResponse("Missing data: anomalyId required", 400);
    }

    if (!resolutionNotes || resolutionNotes.trim() === "") {
      return errorResponse("Missing data: resolutionNotes required", 400);
    }

    // Verifica che l'anomalia esista
    const anomaly = await getAnomalyById(anomalyId);
    if (!anomaly) {
      return errorResponse("Anomaly not found", 404);
    }

    // Verifica che l'anomalia sia aperta
    if (anomaly.status !== "open") {
      return errorResponse(`Anomaly cannot be closed: it is in status "${anomaly.status}"`, 422);
    }

    // Non puoi chiudere un'anomalia che hai segnalato (reporter = resolver)
    if (anomaly.reporter_id === resolverId) {
      return errorResponse("You cannot close an anomaly you reported yourself", 422);
    }

    await closeAnomaly(anomalyId, resolverId, resolutionNotes);

    return successResponse({
      anomalyId,
      status: "closed",
      closedAt: new Date(),
    }, "Anomaly successfully closed", 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
