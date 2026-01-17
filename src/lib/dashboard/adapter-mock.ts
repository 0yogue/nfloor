import { DashboardDataSource, get_date_range } from "./adapter";
import { Lead, User, Area, DateFilter, TeamMetrics, SellerRanking } from "./types";
import { AccessLevel } from "@/types/rbac";
import { MOCK_LEADS, MOCK_USERS, MOCK_AREAS, get_team_metrics, get_seller_ranking } from "./mock-data";

export class MockDataSource implements DashboardDataSource {
  private filter_leads_by_date(leads: Lead[], filter: DateFilter): Lead[] {
    const { start, end } = get_date_range(filter);
    return leads.filter(lead => {
      const created = new Date(lead.created_at);
      return created >= start && created <= end;
    });
  }

  async get_leads_by_company(company_id: string, filter: DateFilter): Promise<Lead[]> {
    const company_leads = MOCK_LEADS.filter(l => l.company_id === company_id);
    return this.filter_leads_by_date(company_leads, filter);
  }

  async get_leads_by_area(area_id: string, filter: DateFilter): Promise<Lead[]> {
    const area_leads = MOCK_LEADS.filter(l => l.area_id === area_id);
    return this.filter_leads_by_date(area_leads, filter);
  }

  async get_leads_by_areas(area_ids: string[], filter: DateFilter): Promise<Lead[]> {
    const areas_leads = MOCK_LEADS.filter(l => area_ids.includes(l.area_id));
    return this.filter_leads_by_date(areas_leads, filter);
  }

  async get_leads_by_seller(seller_id: string, filter: DateFilter): Promise<Lead[]> {
    const seller_leads = MOCK_LEADS.filter(l => l.seller_id === seller_id);
    return this.filter_leads_by_date(seller_leads, filter);
  }

  async get_users_by_company(company_id: string): Promise<User[]> {
    return MOCK_USERS.filter(u => u.company_id === company_id);
  }

  async get_users_by_area(area_id: string): Promise<User[]> {
    return MOCK_USERS.filter(u => u.area_id === area_id);
  }

  async get_users_by_areas(area_ids: string[]): Promise<User[]> {
    return MOCK_USERS.filter(u => u.area_id && area_ids.includes(u.area_id));
  }

  async get_areas_by_company(company_id: string): Promise<Area[]> {
    return MOCK_AREAS.filter(a => a.company_id === company_id);
  }

  async get_area(area_id: string): Promise<Area | null> {
    return MOCK_AREAS.find(a => a.id === area_id) || null;
  }

  async has_level_in_company(company_id: string, level: AccessLevel): Promise<boolean> {
    return MOCK_USERS.some(u => u.company_id === company_id && u.access_level === level);
  }

  async get_team_metrics(seller_ids: string[]): Promise<TeamMetrics> {
    return get_team_metrics(seller_ids);
  }

  async get_seller_ranking(seller_ids: string[]): Promise<SellerRanking[]> {
    return get_seller_ranking(seller_ids);
  }
}
