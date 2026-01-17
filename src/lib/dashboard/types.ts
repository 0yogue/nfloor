import { AccessLevel, ConversationStatus, SenderType } from "@/types/rbac";

export enum LeadStatus {
  NEW = "NEW",
  QUALIFIED = "QUALIFIED",
  CALLBACK = "CALLBACK",
  PROPOSAL = "PROPOSAL",
  SOLD = "SOLD",
  LOST = "LOST",
}

export interface LeadMetrics {
  new_count: number;
  qualified_count: number;
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
}

export interface DashboardData {
  user_metrics: LeadMetrics;
  team_metrics: TeamMetrics;
  subordinates: SubordinateMetrics[];
  seller_ranking: SellerRanking[];
  total_metrics: LeadMetrics;
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
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  notes: string | null;
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
