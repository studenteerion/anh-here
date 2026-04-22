/**
 * Authentication domain types
 */

export interface JWTPayload {
  sub: number;
  data:
    | {
        context?: "tenant";
        role_id: number;
        tenant_id: number;
      }
    | {
        context: "platform";
        role_id: number;
        tenant_id: number;
      };
  iat: number;
  exp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Tenant selection payload for JWT
 */
export interface TenantSelectionPayload {
  sub: number;
  tenant_id: number;
  context: "tenant_selection";
  iat: number;
  exp: number;
}

/**
 * Platform refresh token payload
 */
export interface PlatformRefreshPayload {
  sub: number;
  type: "platform_refresh";
  iat: number;
  exp: number;
}
