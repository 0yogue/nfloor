/**
 * AI-driven Lead Temperature Calculator
 * Calculates lead temperature based on engagement signals
 */

import { LeadFull, LeadTemperature } from "@/types/leads";

interface TemperatureFactors {
  hours_since_last_contact: number;
  message_count: number;
  response_rate: number;
  days_since_creation: number;
  has_phone: boolean;
  has_email: boolean;
  portal_score?: number;
}

interface TemperatureResult {
  temperature: LeadTemperature;
  score: number;
  factors: {
    recency_score: number;
    engagement_score: number;
    contact_info_score: number;
    portal_score: number;
  };
  recommendation: string;
  priority: number;
}

export function calculate_lead_temperature(lead: LeadFull): TemperatureResult {
  const now = new Date();
  const last_contact = lead.last_contact_at ? new Date(lead.last_contact_at) : null;
  const created_at = new Date(lead.created_at);

  const hours_since_last_contact = last_contact
    ? (now.getTime() - last_contact.getTime()) / (1000 * 60 * 60)
    : (now.getTime() - created_at.getTime()) / (1000 * 60 * 60);

  const days_since_creation = (now.getTime() - created_at.getTime()) / (1000 * 60 * 60 * 24);

  const recency_score = calculate_recency_score(hours_since_last_contact);
  const engagement_score = calculate_engagement_score(lead.message_count, days_since_creation);
  const contact_info_score = calculate_contact_info_score(!!lead.phone, !!lead.email);
  const portal_score = lead.portal_score ?? 50;

  const total_score =
    recency_score * 0.35 +
    engagement_score * 0.25 +
    contact_info_score * 0.15 +
    portal_score * 0.25;

  const temperature = score_to_temperature(total_score);
  const recommendation = get_recommendation(temperature, hours_since_last_contact, lead);
  const priority = calculate_priority(temperature, hours_since_last_contact);

  return {
    temperature,
    score: Math.round(total_score),
    factors: {
      recency_score: Math.round(recency_score),
      engagement_score: Math.round(engagement_score),
      contact_info_score: Math.round(contact_info_score),
      portal_score: Math.round(portal_score),
    },
    recommendation,
    priority,
  };
}

function calculate_recency_score(hours: number): number {
  if (hours <= 1) return 100;
  if (hours <= 4) return 90;
  if (hours <= 12) return 75;
  if (hours <= 24) return 60;
  if (hours <= 48) return 40;
  if (hours <= 72) return 25;
  if (hours <= 168) return 15;
  return 5;
}

function calculate_engagement_score(message_count: number, days: number): number {
  if (days === 0) days = 1;
  const messages_per_day = message_count / days;

  if (messages_per_day >= 3) return 100;
  if (messages_per_day >= 2) return 85;
  if (messages_per_day >= 1) return 70;
  if (messages_per_day >= 0.5) return 50;
  if (message_count >= 1) return 30;
  return 10;
}

function calculate_contact_info_score(has_phone: boolean, has_email: boolean): number {
  if (has_phone && has_email) return 100;
  if (has_phone) return 80;
  if (has_email) return 50;
  return 20;
}

function score_to_temperature(score: number): LeadTemperature {
  if (score >= 70) return LeadTemperature.HOT;
  if (score >= 50) return LeadTemperature.WARM;
  if (score >= 30) return LeadTemperature.COOLING;
  return LeadTemperature.COLD;
}

function get_recommendation(
  temperature: LeadTemperature,
  hours_since_contact: number,
  lead: LeadFull
): string {
  switch (temperature) {
    case LeadTemperature.HOT:
      if (hours_since_contact < 2) {
        return "Lead muito quente! Responda imediatamente para maximizar conversão.";
      }
      return "Lead quente! Priorize o contato nas próximas horas.";

    case LeadTemperature.WARM:
      if (hours_since_contact > 24) {
        return "Retome contato hoje. Lead ainda tem interesse mas está esfriando.";
      }
      return "Bom momento para follow-up. Mantenha o engajamento.";

    case LeadTemperature.COOLING:
      return "Lead esfriando! Tente reativar com uma oferta especial ou novidade.";

    case LeadTemperature.COLD:
      if (lead.message_count > 0) {
        return "Lead frio com histórico. Considere campanha de reativação.";
      }
      return "Lead frio sem engajamento. Baixa prioridade.";
  }
}

function calculate_priority(temperature: LeadTemperature, hours_since_contact: number): number {
  const base_priority = {
    [LeadTemperature.HOT]: 100,
    [LeadTemperature.WARM]: 70,
    [LeadTemperature.COOLING]: 40,
    [LeadTemperature.COLD]: 10,
  }[temperature];

  const urgency_bonus = hours_since_contact < 4 ? 20 : hours_since_contact < 12 ? 10 : 0;

  return Math.min(100, base_priority + urgency_bonus);
}

export function get_leads_to_call_today(leads: LeadFull[], limit: number = 10): LeadFull[] {
  const scored_leads = leads
    .map(lead => ({
      lead,
      result: calculate_lead_temperature(lead),
    }))
    .filter(
      ({ result }) =>
        result.temperature === LeadTemperature.HOT ||
        result.temperature === LeadTemperature.WARM ||
        (result.temperature === LeadTemperature.COOLING && result.priority > 30)
    )
    .sort((a, b) => b.result.priority - a.result.priority);

  return scored_leads.slice(0, limit).map(({ lead }) => lead);
}

export function get_cooling_leads(leads: LeadFull[]): LeadFull[] {
  const now = new Date();

  return leads.filter(lead => {
    const last_contact = lead.last_contact_at ? new Date(lead.last_contact_at) : null;
    if (!last_contact) return false;

    const hours_since = (now.getTime() - last_contact.getTime()) / (1000 * 60 * 60);

    const was_hot_or_warm =
      lead.temperature === LeadTemperature.HOT || lead.temperature === LeadTemperature.WARM;

    return was_hot_or_warm && hours_since > 24 && hours_since < 72;
  });
}

export function get_leads_without_response(leads: LeadFull[], hours_threshold: number = 2): LeadFull[] {
  return leads.filter(lead => {
    return (lead.hours_without_response ?? 0) >= hours_threshold;
  });
}
