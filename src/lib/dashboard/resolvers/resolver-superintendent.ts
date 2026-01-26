import { DashboardDataSource } from "../adapter";
import { DashboardData, DateFilter, SubordinateMetrics } from "../types";
import { SessionUser, AccessLevel } from "@/types/rbac";
import { calculate_metrics, sum_metrics, empty_metrics, empty_team_metrics } from "../metrics";
import { get_date_range } from "../adapter";

export async function resolve_superintendent_dashboard(
  user: SessionUser,
  filter: DateFilter,
  data_source: DashboardDataSource
): Promise<DashboardData> {
  const { start, end } = get_date_range(filter);
  
  if (!user.company_id) {
    return {
      user_metrics: empty_metrics(),
      team_metrics: empty_team_metrics(),
      subordinates: [],
      seller_ranking: [],
      total_metrics: empty_metrics(),
      period: { start, end, label: get_period_label(filter) },
    };
  }
  
  // Superintendent manages multiple areas
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
  
  // Check if there are managers in these areas
  const users = await data_source.get_users_by_areas(area_ids);
  const managers = users.filter(u => u.access_level === AccessLevel.MANAGER);
  
  // Get all sellers in managed areas for team metrics first
  const sellers = users.filter(u => u.access_level === AccessLevel.SELLER);
  const seller_ids = sellers.map(s => s.id);
  const team_metrics = await data_source.get_team_metrics(seller_ids);
  const seller_ranking = await data_source.get_seller_ranking(seller_ids);
  
  // Calculate avg response time per area/manager
  const subordinates: SubordinateMetrics[] = [];
  
  if (managers.length > 0) {
    // Show metrics grouped by manager
    for (const manager of managers) {
      if (!manager.area_id) continue;
      
      const area = await data_source.get_area(manager.area_id);
      const leads = await data_source.get_leads_by_area(manager.area_id, filter);
      const metrics = calculate_metrics(leads);
      
      // Get sellers in this manager's area and calculate avg response time
      const area_sellers = sellers.filter(s => s.area_id === manager.area_id);
      const area_seller_rankings = seller_ranking.filter(r => area_sellers.some(s => s.id === r.id));
      const avg_response_time = area_seller_rankings.length > 0
        ? area_seller_rankings.reduce((sum, r) => sum + r.avg_response_time, 0) / area_seller_rankings.length
        : undefined;
      
      subordinates.push({
        id: manager.id,
        name: `${manager.name}${area ? ` (${area.name})` : ""}`,
        type: "manager",
        access_level: AccessLevel.MANAGER,
        metrics,
        avg_response_time,
      });
    }
  } else {
    // No managers - show metrics by area with sellers
    const areas = await Promise.all(area_ids.map(id => data_source.get_area(id)));
    
    for (const area of areas) {
      if (!area) continue;
      
      const leads = await data_source.get_leads_by_area(area.id, filter);
      const metrics = calculate_metrics(leads);
      
      // Get sellers in this area and calculate avg response time
      const area_sellers = sellers.filter(s => s.area_id === area.id);
      const area_seller_rankings = seller_ranking.filter(r => area_sellers.some(s => s.id === r.id));
      const avg_response_time = area_seller_rankings.length > 0
        ? area_seller_rankings.reduce((sum, r) => sum + r.avg_response_time, 0) / area_seller_rankings.length
        : undefined;
      
      subordinates.push({
        id: area.id,
        name: area.name,
        type: "area",
        metrics,
        avg_response_time,
      });
    }
  }
  
  // Sort by sold count descending
  subordinates.sort((a, b) => b.metrics.sold_count - a.metrics.sold_count);
  
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
