import prisma from "@/lib/prisma/client";
import { hash_password, verify_password } from "./password";
import { generate_token, hash_token, get_token_expiration } from "./jwt";
import { set_session_cookie, clear_session_cookie, invalidate_session } from "./session";
import { AccessLevel, UserStatus } from "@prisma/client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    access_level: AccessLevel;
  };
}

export async function login(
  credentials: LoginCredentials,
  ip_address?: string,
  user_agent?: string
): Promise<LoginResult> {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { company: true },
  });

  if (!user) {
    return { success: false, error: "Credenciais inválidas" };
  }

  if (user.status !== UserStatus.ACTIVE) {
    return { success: false, error: "Usuário inativo ou suspenso" };
  }

  if (user.company && !user.company.is_active) {
    return { success: false, error: "Empresa inativa" };
  }

  const password_valid = await verify_password(password, user.password_hash);
  if (!password_valid) {
    return { success: false, error: "Credenciais inválidas" };
  }

  const token = generate_token({
    sub: user.id,
    email: user.email,
    access_level: user.access_level,
    company_id: user.company_id,
  });

  const expires_at = get_token_expiration(token);
  if (!expires_at) {
    return { success: false, error: "Erro ao gerar sessão" };
  }

  await prisma.session.create({
    data: {
      user_id: user.id,
      token_hash: hash_token(token),
      expires_at,
      ip_address,
      user_agent,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  await set_session_cookie(token, expires_at);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      access_level: user.access_level,
    },
  };
}

export async function logout(token?: string): Promise<void> {
  if (token) {
    await invalidate_session(token);
  }
  await clear_session_cookie();
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  company_id?: string;
  area_id?: string;
  access_level?: AccessLevel;
}

export async function register(data: RegisterData): Promise<{
  success: boolean;
  error?: string;
  user_id?: string;
}> {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return { success: false, error: "Email já cadastrado" };
  }

  const password_hash = await hash_password(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      password_hash,
      name: data.name,
      company_id: data.company_id,
      area_id: data.area_id,
      access_level: data.access_level || AccessLevel.SELLER,
    },
  });

  return { success: true, user_id: user.id };
}
