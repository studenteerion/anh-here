import * as jsonwebtoken from 'jsonwebtoken';

type JwtLib = {
  sign: (payload: unknown, secret: string, options?: Record<string, unknown>) => string;
  verify: (token: string, secret: string, options?: Record<string, unknown>) => unknown;
};

const jwtLib = jsonwebtoken as unknown as JwtLib;

export function sign(payload: unknown, secret: string, options?: Record<string, unknown>): string {
  return jwtLib.sign(payload, secret, options);
}

export function verify<T = unknown>(token: string, secret: string, options?: Record<string, unknown>): T {
  return jwtLib.verify(token, secret, options) as T;
}

export default { sign, verify };
