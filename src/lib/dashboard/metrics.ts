import { Lead, LeadMetrics, LeadStatus, TeamMetrics } from "./types";

export function calculate_metrics(leads: Lead[]): LeadMetrics {
  return {
    lead_count: leads.filter(l => l.status === LeadStatus.LEAD).length,
    visit_count: leads.filter(l => l.status === LeadStatus.VISIT).length,
    callback_count: leads.filter(l => l.status === LeadStatus.CALLBACK).length,
    proposal_count: leads.filter(l => l.status === LeadStatus.PROPOSAL).length,
    sold_count: leads.filter(l => l.status === LeadStatus.SOLD).length,
  };
}

export function sum_metrics(metrics_list: LeadMetrics[]): LeadMetrics {
  return metrics_list.reduce(
    (acc, m) => ({
      lead_count: acc.lead_count + m.lead_count,
      visit_count: acc.visit_count + m.visit_count,
      callback_count: acc.callback_count + m.callback_count,
      proposal_count: acc.proposal_count + m.proposal_count,
      sold_count: acc.sold_count + m.sold_count,
    }),
    { lead_count: 0, visit_count: 0, callback_count: 0, proposal_count: 0, sold_count: 0 }
  );
}

export function empty_metrics(): LeadMetrics {
  return {
    lead_count: 0,
    visit_count: 0,
    callback_count: 0,
    proposal_count: 0,
    sold_count: 0,
  };
}

export function empty_team_metrics(): TeamMetrics {
  return {
    sellers_online: 0,
    sellers_offline: 0,
    new_conversations: 0,
    avg_response_time: 0,
    avg_playbook_score: 0,
    leads_without_response: 0,
    avg_attendance_score: 0,
    new_leads: 0,
    reactivated_conversations: 0,
    avg_first_response_time: 0,
    avg_weighted_response_time: 0,
    clients_no_response_2h: 0,
    clients_no_response_24h: 0,
    conversations_with_activity: 0,
  };
}
