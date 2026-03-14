import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, authErrorResponse, errorResponse, successResponse } from "@/lib/middleware";
import { checkUserPermission, createPermission } from "@/lib/db/permissions";

export async function POST(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (authResult.error) return authErrorResponse(authResult);

  const myUserId = authResult.payload!.sub;

  try {
    const body = await req.json();
    const permissionCode = body.permissionCode;
    const description = body.description;

    if (!permissionCode || !description) {
      return errorResponse("Dati mancanti (permissionCode o description)", 400);
    }

    const hasPerm = await checkUserPermission(myUserId, "user_permissions_create");
    if (!hasPerm) {
      return errorResponse("Permessi insufficienti per creare le autorizzazioni", 403);
    }

    const result = await createPermission(permissionCode, description);
    if (!result) {
      return errorResponse("Errore durante la creazione del permesso", 409);
    }

    return successResponse(undefined, "Permesso creato con successo", 201);
  } catch (e) {
    console.error("Endpoint error:", e);
    return errorResponse("Server error", 500);
  }
}
