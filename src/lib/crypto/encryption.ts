import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function get_encryption_key(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    console.warn("ENCRYPTION_KEY não configurada ou inválida. Usando chave padrão para desenvolvimento.");
    return Buffer.from("0".repeat(64), "hex");
  }
  return Buffer.from(key, "hex");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, get_encryption_key(), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(encrypted_text: string): string {
  const parts = encrypted_text.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de texto criptografado inválido");
  }
  
  const [iv_hex, tag_hex, encrypted] = parts;
  
  const iv = Buffer.from(iv_hex, "hex");
  const tag = Buffer.from(tag_hex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, get_encryption_key(), iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
