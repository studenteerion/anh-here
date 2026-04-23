import * as jsonwebtoken from 'jsonwebtoken';

export function sign(payload: any, secret: string, options?: any): string {
  return (jsonwebtoken as any).sign(payload, secret, options);
}

export function verify<T = any>(token: string, secret: string, options?: any): T {
  return (jsonwebtoken as any).verify(token, secret, options) as T;
}

export default {
  sign,
  verify,
};
