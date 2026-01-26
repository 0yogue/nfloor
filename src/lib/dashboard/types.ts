import { AccessLevel, ConversationStatus, SenderType } from "@/types/rbac";

export enum LeadStatus {
  LEAD = "LEAD",
  VISIT = "VISIT",
  CALLBACK = "CALLBACK",
  PROPOSAL = "PROPOSAL",
  SOLD = "SOLD",
  LOST = "LOST",
}

export enum LeadSource {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  BALCAO = "BALCAO",
  CRM = "CRM",
  HUBSPOT = "HUBSPOT",
  ZAP_IMOVEIS = "ZAP_IMOVEIS",
  OLX = "OLX",
  VIVA_REAL = "VIVA_REAL",
  CHAVES_NA_MAO = "CHAVES_NA_MAO",
  WEBSITE = "WEBSITE",
  INDICATION = "INDICATION",
  OTHER = "OTHER",
}

export interface LeadMetrics {
  lead_count: number;
  visit_count: number;
  callback_count: number;
  proposal_count: number;
  sold_count: number;
}

export interface TeamMetrics {
  sellers_online: number;
  sellers_offline: number;
  new_conversations: number;
  avg_response_time: number;
  avg_playbook_score: number;
  leads_without_response: number;
  avg_attendance_score: number;
  new_leads: number;
  reactivated_conversations: number;
  avg_first_response_time: number;
  avg_weighted_response_time: number;
  clients_no_response_2h: number;
  clients_no_response_24h: number;
  conversations_with_activity: number;
}

export interface SellerRanking {
  id: string;
  name: string;
  is_online: boolean;
  new_conversations: number;
  avg_response_time: number;
  playbook_score: number;
  leads_without_response: number;
  total_leads: number;
  conversion_rate: number;
}

export interface SubordinateMetrics {
  id: string;
  name: string;
  type: "superintendent" | "manager" | "seller" | "area";
  access_level?: AccessLevel;
  metrics: LeadMetrics;
  team_metrics?: TeamMetrics;
  avg_response_time?: number;
}

export interface DashboardData {
  user_metrics: LeadMetrics;
  team_metrics: TeamMetrics;
  subordinates: SubordinateMetrics[];
  seller_ranking: SellerRanking[];
  total_metrics: LeadMetrics;
  leads?: Lead[];
  period: {
    start: Date;
    end: Date;
    label: string;
  };
}

export interface DateFilter {
  type: "today" | "7days" | "30days" | "custom";
  start?: Date;
  end?: Date;
}

export interface Lead {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  company_name: string | null;
  job_title: string | null;
  website: string | null;
  hubspot_id: string | null;
  hubspot_synced_at: Date | null;
  seller_id: string;
  area_id: string;
  company_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  access_level: AccessLevel;
  company_id: string | null;
  area_id: string | null;
}

export interface Area {
  id: string;
  name: string;
  company_id: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  seller_id: string;
  status: string;
  last_message_at: Date | null;
  last_seller_message: Date | null;
  last_lead_message: Date | null;
  unread_count: number;
  created_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: string;
  content: string;
  response_time: number | null;
  created_at: Date;
}

export interface PlaybookScore {
  id: string;
  conversation_id: string;
  seller_id: string;
  score: number;
  created_at: Date;
}
