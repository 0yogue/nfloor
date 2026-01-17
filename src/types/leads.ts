export enum LeadTemperature {
  HOT = "HOT",
  WARM = "WARM",
  COOLING = "COOLING",
  COLD = "COLD",
}

export enum LeadSource {
  ZAP_IMOVEIS = "ZAP_IMOVEIS",
  OLX = "OLX",
  VIVA_REAL = "VIVA_REAL",
  IMOVEL_WEB = "IMOVEL_WEB",
  QUINTO_ANDAR = "QUINTO_ANDAR",
  CHAVES_NA_MAO = "CHAVES_NA_MAO",
  FACEBOOK = "FACEBOOK",
  INSTAGRAM = "INSTAGRAM",
  WHATSAPP = "WHATSAPP",
  MANUAL = "MANUAL",
  OTHER = "OTHER",
}

export enum PropertyType {
  APARTMENT = "APARTMENT",
  HOUSE = "HOUSE",
  LAND = "LAND",
  COMMERCIAL = "COMMERCIAL",
  PENTHOUSE = "PENTHOUSE",
  STUDIO = "STUDIO",
  OTHER = "OTHER",
}

export enum OperationType {
  SALE = "SALE",
  RENT = "RENT",
  BOTH = "BOTH",
}

export interface PropertyInterest {
  id: string;
  code: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  property_type: PropertyType;
  operation_type: OperationType;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  price?: number;
  portal_url?: string;
  image_url?: string;
}

export interface LeadMessage {
  id: string;
  content: string;
  sender: "LEAD" | "SELLER";
  channel: "WHATSAPP" | "EMAIL" | "PHONE";
  created_at: Date;
}

export interface LeadFull {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  temperature: LeadTemperature;
  source: LeadSource;
  source_email_subject?: string;
  notes: string | null;
  seller_id: string;
  seller_name?: string;
  area_id: string;
  company_id: string;
  property_interest?: PropertyInterest;
  last_message?: string;
  last_message_at?: Date;
  last_contact_at?: Date;
  hours_without_response?: number;
  message_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface EmailIntegration {
  id: string;
  email_address: string;
  filter_from: string[];
  filter_subject: string[];
  is_active: boolean;
  last_sync_at?: Date;
  created_at: Date;
}

export interface ParsedEmailLead {
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  property: {
    code: string;
    address: string;
    operation_type: OperationType;
  };
  source: LeadSource;
  received_at: Date;
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.ZAP_IMOVEIS]: "ZAP Imóveis",
  [LeadSource.OLX]: "OLX",
  [LeadSource.VIVA_REAL]: "Viva Real",
  [LeadSource.IMOVEL_WEB]: "Imóvel Web",
  [LeadSource.QUINTO_ANDAR]: "QuintoAndar",
  [LeadSource.CHAVES_NA_MAO]: "Chaves na Mão",
  [LeadSource.FACEBOOK]: "Facebook",
  [LeadSource.INSTAGRAM]: "Instagram",
  [LeadSource.WHATSAPP]: "WhatsApp",
  [LeadSource.MANUAL]: "Manual",
  [LeadSource.OTHER]: "Outro",
};

export const TEMPERATURE_CONFIG: Record<LeadTemperature, { label: string; color: string; bgColor: string }> = {
  [LeadTemperature.HOT]: { label: "Quente", color: "text-red-600", bgColor: "bg-red-500" },
  [LeadTemperature.WARM]: { label: "Morno", color: "text-yellow-600", bgColor: "bg-yellow-500" },
  [LeadTemperature.COOLING]: { label: "Esfriando", color: "text-orange-600", bgColor: "bg-orange-500" },
  [LeadTemperature.COLD]: { label: "Frio", color: "text-blue-600", bgColor: "bg-blue-500" },
};
