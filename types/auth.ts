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
