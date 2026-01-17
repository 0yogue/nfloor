import { cookies } from "next/headers";
import prisma from "@/lib/prisma/client";
import { verify_token, hash_token } from "./jwt";
import { SessionUser, AccessLevel, UserStatus, LicenseType } from "@/types/rbac";

const COOKIE_NAME = "nfloor_session";

export async function get_session_user(): Promise<SessionUser | null> {
  const cookie_store = await cookies();
  const token = cookie_store.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verify_token(token);
  if (!payload) {
    return null;
  }

  const token_hash = hash_token(token);
  const session = await prisma.session.findUnique({
    where: { token_hash },
    include: {
      user: {
        include: {
          company: true,
          area: true,
          managed_areas: {
            select: { area_id: true },
          },
        },
      },
    },
  });

  if (!session || session.expires_at < new Date()) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { last_used_at: new Date() },
  });

  const user = session.user;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    access_level: user.access_level as AccessLevel,
    status: user.status as UserStatus,
    company_id: user.company_id,
    company_name: user.company?.name || null,
    company_slug: user.company?.slug || null,
    license_type: (user.company?.license_type as LicenseType) || null,
    area_id: user.area_id,
    area_name: user.area?.name || null,
    managed_area_ids: user.managed_areas.map((ma) => ma.area_id),
  };
}

export async function set_session_cookie(token: string, expires_at: Date): Promise<void> {
  const cookie_store = await cookies();
  cookie_store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expires_at,
    path: "/",
  });
}

export async function clear_session_cookie(): Promise<void> {
  const cookie_store = await cookies();
  cookie_store.delete(COOKIE_NAME);
}

export async function invalidate_session(token: string): Promise<void> {
  const token_hash = hash_token(token);
  await prisma.session.deleteMany({
    where: { token_hash },
  });
}

export async function invalidate_all_user_sessions(user_id: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { user_id },
  });
}
