import { DashboardDataSource } from "../adapter";
import { DashboardData, DateFilter, SubordinateMetrics } from "../types";
import { SessionUser } from "@/types/rbac";
import { calculate_metrics, empty_metrics, empty_team_metrics } from "../metrics";
import { get_date_range } from "../adapter";

export async function resolve_seller_dashboard(
  user: SessionUser,
  filter: DateFilter,
  data_source: DashboardDataSource
): Promise<DashboardData> {
  const { start, end } = get_date_range(filter);
  
  const leads = await data_source.get_leads_by_seller(user.id, filter);
  const user_metrics = calculate_metrics(leads);
  
  // Seller sees only their own metrics, no subordinates
  const subordinates: SubordinateMetrics[] = [];
  
  // Seller sees their own team metrics
  const team_metrics = await data_source.get_team_metrics([user.id]);
  const seller_ranking = await data_source.get_seller_ranking([user.id]);
  
  return {
    user_metrics,
    team_metrics,
    subordinates,
    seller_ranking,
    total_metrics: user_metrics,
    period: {
      start,
      end,
      label: get_period_label(filter),
    },
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
