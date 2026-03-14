import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission } from "@/lib/db/permissions";
import { createAnomaly } from "@/lib/db/anomalies";

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);
  const employeeId = authResult.payload!.sub;

  try {
    // Verifica permesso
    const hasPerm = await checkUserPermission(employeeId, "report_anomaly");
    if (!hasPerm) {
      return errorResponse("Permission denied: you don't have access to this feature", 403);
    }

    const body = await req.json();
    const { description, userId } = body;

    if (!description) {
      return errorResponse("Missing data: description required", 400);
    }

    // Determina l'utente per cui segnalare l'anomalia
    const targetUserId = userId ? parseInt(userId) : employeeId;

    // Non puoi segnalare anomalie per te stesso
    if (targetUserId === employeeId) {
      return errorResponse("You cannot report anomalies for yourself", 422);
    }

    const anomalyId = await createAnomaly(targetUserId, description);

    return successResponse({
      anomalyId,
      status: "open",
      createdAt: new Date(),
    }, "Anomaly successfully reported", 200);
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return errorResponse("Server error", 500);
  }
}
