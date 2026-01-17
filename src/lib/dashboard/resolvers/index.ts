import { DashboardDataSource } from "../adapter";
import { DashboardData, DateFilter } from "../types";
import { SessionUser, AccessLevel } from "@/types/rbac";
import { resolve_director_dashboard } from "./resolver-director";
import { resolve_superintendent_dashboard } from "./resolver-superintendent";
import { resolve_manager_dashboard } from "./resolver-manager";
import { resolve_seller_dashboard } from "./resolver-seller";
import { empty_metrics, empty_team_metrics } from "../metrics";
import { get_date_range } from "../adapter";

export async function resolve_dashboard(
  user: SessionUser,
  filter: DateFilter,
  data_source: DashboardDataSource
): Promise<DashboardData> {
  const { start, end } = get_date_range(filter);
  
  switch (user.access_level) {
    case AccessLevel.SUPER_ADMIN:
    case AccessLevel.DIRECTOR:
      return resolve_director_dashboard(user, filter, data_source);
    
    case AccessLevel.SUPERINTENDENT:
      return resolve_superintendent_dashboard(user, filter, data_source);
    
    case AccessLevel.MANAGER:
      return resolve_manager_dashboard(user, filter, data_source);
    
    case AccessLevel.SELLER:
      return resolve_seller_dashboard(user, filter, data_source);
    
    default:
      return {
        user_metrics: empty_metrics(),
        team_metrics: empty_team_metrics(),
        subordinates: [],
        seller_ranking: [],
        total_metrics: empty_metrics(),
        period: { start, end, label: "" },
      };
  }
}

export { resolve_director_dashboard } from "./resolver-director";
export { resolve_superintendent_dashboard } from "./resolver-superintendent";
export { resolve_manager_dashboard } from "./resolver-manager";
export { resolve_seller_dashboard } from "./resolver-seller";
