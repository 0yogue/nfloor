/**
 * Integration Types for NFloor
 * Handles Email and WhatsApp integrations
 */

export enum IntegrationType {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
}

export enum IntegrationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  ERROR = "ERROR",
}

export enum EmailProvider {
  GMAIL = "GMAIL",
  OUTLOOK = "OUTLOOK",
  IMAP = "IMAP",
}

export enum WhatsAppProvider {
  EVOLUTION_API = "EVOLUTION_API",
}

export interface EmailFilter {
  id: string;
  type: "sender" | "subject";
  pattern: string;
  is_regex: boolean;
}

export interface EmailIntegrationConfig {
  id: string;
  company_id: string;
  name: string;
  provider: EmailProvider;
  email_address: string;
  status: IntegrationStatus;
  filters: EmailFilter[];
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppInstance {
  id: string;
  company_id: string;
  instance_name: string;
  instance_id: string;
  status: IntegrationStatus;
  phone_number?: string;
  qr_code?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EvolutionAPIConfig {
  base_url: string;
  api_key: string;
  instance_name: string;
}

export interface EvolutionAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface EvolutionInstanceInfo {
  instanceName: string;
  state: "open" | "close" | "connecting";
  profileName?: string;
  profilePictureUrl?: string;
  number?: string;
}

export interface EvolutionQRCode {
  base64: string;
  code: string;
}

export interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp?: number;
  };
}

export const DEFAULT_EMAIL_FILTERS: EmailFilter[] = [
  { id: "zap", type: "sender", pattern: "zapimoveis.com.br", is_regex: false },
  { id: "vivareal", type: "sender", pattern: "vivareal.com.br", is_regex: false },
  { id: "olx", type: "sender", pattern: "olx.com.br", is_regex: false },
  { id: "imovelweb", type: "sender", pattern: "imovelweb.com.br", is_regex: false },
  { id: "quintoandar", type: "sender", pattern: "quintoandar.com.br", is_regex: false },
  { id: "subject_lead", type: "subject", pattern: "consulta", is_regex: false },
  { id: "subject_interest", type: "subject", pattern: "interesse", is_regex: false },
];

export const PORTAL_CONFIGS = [
  {
    id: "zap",
    name: "ZAP Imóveis",
    domain: "zapimoveis.com.br",
    color: "#6E0AD6",
    logo: "🏠",
  },
  {
    id: "vivareal",
    name: "Viva Real",
    domain: "vivareal.com.br",
    color: "#00A651",
    logo: "🏡",
  },
  {
    id: "olx",
    name: "OLX",
    domain: "olx.com.br",
    color: "#6E0CAB",
    logo: "📦",
  },
  {
    id: "imovelweb",
    name: "Imóvel Web",
    domain: "imovelweb.com.br",
    color: "#FF6600",
    logo: "🌐",
  },
  {
    id: "quintoandar",
    name: "QuintoAndar",
    domain: "quintoandar.com.br",
    color: "#FFC107",
    logo: "🔑",
  },
];
