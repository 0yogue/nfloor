import { DashboardDataSource } from "../adapter";
import { DashboardData, DateFilter, SubordinateMetrics } from "../types";
import { SessionUser, AccessLevel } from "@/types/rbac";
import { calculate_metrics, sum_metrics, empty_metrics, empty_team_metrics } from "../metrics";
import { get_date_range } from "../adapter";

export async function resolve_manager_dashboard(
  user: SessionUser,
  filter: DateFilter,
  data_source: DashboardDataSource
): Promise<DashboardData> {
  const { start, end } = get_date_range(filter);
  
  // Manager can manage their own area or multiple managed areas
  const area_ids = user.managed_area_ids.length > 0 
    ? user.managed_area_ids 
    : user.area_id 
      ? [user.area_id] 
      : [];
  
  if (area_ids.length === 0) {
    return {
      user_metrics: empty_metrics(),
      team_metrics: empty_team_metrics(),
      subordinates: [],
      seller_ranking: [],
      total_metrics: empty_metrics(),
      period: { start, end, label: get_period_label(filter) },
    };
  }
  
  // Get all sellers in the managed areas
  const users = await data_source.get_users_by_areas(area_ids);
  const sellers = users.filter(u => u.access_level === AccessLevel.SELLER);
  
  // Get team metrics and seller ranking first to get avg_response_time
  const seller_ids = sellers.map(s => s.id);
  const team_metrics = await data_source.get_team_metrics(seller_ids);
  const seller_ranking = await data_source.get_seller_ranking(seller_ids);
  
  // Create a map of seller_id to avg_response_time from ranking
  const response_time_map = new Map(
    seller_ranking.map(r => [r.id, r.avg_response_time])
  );
  
  // Calculate metrics for each seller
  const subordinates: SubordinateMetrics[] = [];
  
  for (const seller of sellers) {
    const leads = await data_source.get_leads_by_seller(seller.id, filter);
    const metrics = calculate_metrics(leads);
    
    subordinates.push({
      id: seller.id,
      name: seller.name,
      type: "seller",
      access_level: AccessLevel.SELLER,
      metrics,
      avg_response_time: response_time_map.get(seller.id),
    });
  }
  
  // Sort by total activity (new + qualified + proposal + sold)
  subordinates.sort((a, b) => {
    const total_a = a.metrics.new_count + a.metrics.qualified_count + a.metrics.proposal_count + a.metrics.sold_count;
    const total_b = b.metrics.new_count + b.metrics.qualified_count + b.metrics.proposal_count + b.metrics.sold_count;
    return total_b - total_a;
  });
  
  const total_metrics = sum_metrics(subordinates.map(s => s.metrics));
  
  return {
    user_metrics: total_metrics,
    team_metrics,
    subordinates,
    seller_ranking,
    total_metrics,
    period: { start, end, label: get_period_label(filter) },
  };
}

function get_period_label(filter: DateFilter): string {
  switch (filter.type) {
    case "today":
      return "Hoje";
    case "7days":
      return "Últimos 7 dias";
    case "30days":
      return "Últimos 30 dias";
    case "custom":
      return "Período personalizado";
    default:
      return "";
  }
}
