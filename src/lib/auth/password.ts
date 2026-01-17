import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hash_password(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verify_password(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
