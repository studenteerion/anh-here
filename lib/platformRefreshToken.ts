import jwt from "jsonwebtoken";
import { PlatformRefreshPayload } from "@/types/auth";

const JWT_KEY = process.env.JWT_KEY!;

export function createPlatformRefreshToken(globalUserId: number): string {
  return jwt.sign(
    {
      iss: "ANH-here",
      sub: globalUserId,
      data: { context: "platform", purpose: "platform_refresh" },
    },
    JWT_KEY,
    { expiresIn: "7d" }
  );
}

export function verifyPlatformRefreshToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, JWT_KEY) as PlatformRefreshPayload;
    if (payload?.data?.context !== "platform" || payload?.data?.purpose !== "platform_refresh") {
      return null;
    }
    return Number.isInteger(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}

