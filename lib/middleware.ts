import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_KEY = process.env.JWT_KEY!;

export interface AuthPayload {
  iss: string;
  sub: number;
  data: {
    role_id: number;
  };
  iat: number;
  exp: number;
}

export function verifyAuth(req: NextRequest): { payload?: AuthPayload; error?: string; status?: number; token_expired?: boolean } {
  try {
    // Prima prova a leggere dal cookie (metodo sicuro)
    let token = req.cookies.get("access_token")?.value;
    
    // Fallback: leggi dall'header Authorization (per compatibilità con API esterne)
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return { error: "Missing or malformed token", status: 401 };
    }

    const decoded = jwt.verify(token, JWT_KEY) as AuthPayload;

    return { payload: decoded };
  } catch (error: any) {
    if (error?.name === "TokenExpiredError") {
      return { error: "Token expired", status: 401, token_expired: true };
    }
    return { error: "Invalid token", status: 401 };
  }
}

export function authErrorResponse(result: { error?: string; status?: number; token_expired?: boolean }) {
  const errorCode = result.token_expired ? "TOKEN_EXPIRED" : undefined;
  return NextResponse.json(
    {
      status: "error",
      message: result.error || "Authentication error",
      ...(errorCode && { error_code: errorCode }),
    },
    { status: result.status || 401 }
  );
}

export function errorResponse(
  message: string,
  httpStatus: number = 400,
  errorCode?: string
): NextResponse {
  return NextResponse.json(
    {
      status: "error",
      message,
      ...(errorCode && { error_code: errorCode }),
    },
    { status: httpStatus }
  );
}

export function successResponse(
  data?: any,
  message?: string,
  httpStatus: number = 200
): NextResponse {
  const response: Record<string, any> = {
    status: "success",
  };

  if (message) response.message = message;
  if (data) response.data = data;

  return NextResponse.json(response, { status: httpStatus });
}
