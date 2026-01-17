import { DashboardDataSource } from "../adapter";
import { DashboardData, DateFilter, SubordinateMetrics, TeamMetrics, SellerRanking } from "../types";
import { SessionUser, AccessLevel } from "@/types/rbac";
import { calculate_metrics, sum_metrics, empty_metrics, empty_team_metrics } from "../metrics";
import { get_date_range } from "../adapter";

export async function resolve_director_dashboard(
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
  
  const company_users = await data_source.get_users_by_company(user.company_id);
  const subordinates: SubordinateMetrics[] = [];
  
  // Check hierarchy: Superintendents > Managers > Sellers
  const superintendents = company_users.filter(u => u.access_level === AccessLevel.SUPERINTENDENT);
  const managers = company_users.filter(u => u.access_level === AccessLevel.MANAGER);
  const sellers = company_users.filter(u => u.access_level === AccessLevel.SELLER);
  
  if (superintendents.length > 0) {
    // Show metrics grouped by superintendent
    for (const super_user of superintendents) {
      // Get all leads from company for now (superintendent manages all areas)
      const leads = await data_source.get_leads_by_company(user.company_id, filter);
      const metrics = calculate_metrics(leads);
      
      subordinates.push({
        id: super_user.id,
        name: super_user.name,
        type: "superintendent",
        access_level: AccessLevel.SUPERINTENDENT,
        metrics,
      });
    }
  } else if (managers.length > 0) {
    // No superintendents - show metrics by manager
    for (const manager of managers) {
      if (!manager.area_id) continue;
      
      const area = await data_source.get_area(manager.area_id);
      const leads = await data_source.get_leads_by_area(manager.area_id, filter);
      const metrics = calculate_metrics(leads);
      
      subordinates.push({
        id: manager.id,
        name: `${manager.name}${area ? ` (${area.name})` : ""}`,
        type: "manager",
        access_level: AccessLevel.MANAGER,
        metrics,
      });
    }
  } else if (sellers.length > 0) {
    // No managers - show metrics by seller
    for (const seller of sellers) {
      const leads = await data_source.get_leads_by_seller(seller.id, filter);
      const metrics = calculate_metrics(leads);
      
      subordinates.push({
        id: seller.id,
        name: seller.name,
        type: "seller",
        access_level: AccessLevel.SELLER,
        metrics,
      });
    }
  } else {
    // No users - show metrics by area
    const areas = await data_source.get_areas_by_company(user.company_id);
    
    for (const area of areas) {
      const leads = await data_source.get_leads_by_area(area.id, filter);
      const metrics = calculate_metrics(leads);
      
      subordinates.push({
        id: area.id,
        name: area.name,
        type: "area",
        metrics,
      });
    }
  }
  
  // Sort by sold count descending
  subordinates.sort((a, b) => b.metrics.sold_count - a.metrics.sold_count);
  
  const total_metrics = sum_metrics(subordinates.map(s => s.metrics));
  
  // Get all seller IDs for team metrics
  const seller_ids = sellers.map(s => s.id);
  const team_metrics = await data_source.get_team_metrics(seller_ids);
  const seller_ranking = await data_source.get_seller_ranking(seller_ids);
  
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
