import { sign, verify } from '@/lib/jwt';
import { PlatformRefreshPayload } from "@/types/auth";

const JWT_KEY = process.env.JWT_KEY!;

export function createPlatformRefreshToken(globalUserId: number): string {
  return sign(
    {
      iss: "ANH-here",
      sub: globalUserId,
      type: "platform_refresh",
    },
    JWT_KEY,
    { expiresIn: "7d" }
  );
}

export function verifyPlatformRefreshToken(token: string): number | null {
  try {
    const payload = verify<PlatformRefreshPayload>(token, JWT_KEY);
    if (payload?.type !== "platform_refresh") {
      return null;
    }
    return Number.isInteger(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}

