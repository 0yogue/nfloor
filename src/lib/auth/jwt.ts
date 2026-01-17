import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { JwtPayload } from "@/types/rbac";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function generate_token(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verify_token(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function decode_token(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export function hash_token(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function get_token_expiration(token: string): Date | null {
  const decoded = decode_token(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
}
