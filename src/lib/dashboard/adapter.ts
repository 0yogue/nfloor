import { Lead, User, Area, LeadStatus, DateFilter, TeamMetrics, SellerRanking } from "./types";
import { AccessLevel } from "@/types/rbac";

export interface DashboardDataSource {
  get_leads_by_company(company_id: string, filter: DateFilter): Promise<Lead[]>;
  get_leads_by_area(area_id: string, filter: DateFilter): Promise<Lead[]>;
  get_leads_by_areas(area_ids: string[], filter: DateFilter): Promise<Lead[]>;
  get_leads_by_seller(seller_id: string, filter: DateFilter): Promise<Lead[]>;
  
  get_users_by_company(company_id: string): Promise<User[]>;
  get_users_by_area(area_id: string): Promise<User[]>;
  get_users_by_areas(area_ids: string[]): Promise<User[]>;
  
  get_areas_by_company(company_id: string): Promise<Area[]>;
  get_area(area_id: string): Promise<Area | null>;
  
  has_level_in_company(company_id: string, level: AccessLevel): Promise<boolean>;
  
  get_team_metrics(seller_ids: string[]): Promise<TeamMetrics>;
  get_seller_ranking(seller_ids: string[]): Promise<SellerRanking[]>;
}

function get_date_range(filter: DateFilter): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  switch (filter.type) {
    case "today":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
        end,
      };
    case "7days":
      const seven_days_ago = new Date(end);
      seven_days_ago.setDate(seven_days_ago.getDate() - 6);
      seven_days_ago.setHours(0, 0, 0, 0);
      return { start: seven_days_ago, end };
    case "30days":
      const thirty_days_ago = new Date(end);
      thirty_days_ago.setDate(thirty_days_ago.getDate() - 29);
      thirty_days_ago.setHours(0, 0, 0, 0);
      return { start: thirty_days_ago, end };
    case "custom":
      return {
        start: filter.start || new Date(0),
        end: filter.end || end,
      };
    default:
      return { start: new Date(0), end };
  }
}

export { get_date_range };
