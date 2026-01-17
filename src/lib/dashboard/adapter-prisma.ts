import { DashboardDataSource, get_date_range } from "./adapter";
import { Lead, User, Area, DateFilter, LeadStatus, TeamMetrics, SellerRanking } from "./types";
import { AccessLevel } from "@/types/rbac";
import prisma from "@/lib/prisma/client";

export class PrismaDataSource implements DashboardDataSource {
  private map_lead(db_lead: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    status: string;
    notes: string | null;
    seller_id: string;
    area_id: string;
    company_id: string;
    created_at: Date;
    updated_at: Date;
  }): Lead {
    return {
      ...db_lead,
      status: db_lead.status as LeadStatus,
    };
  }

  private map_user(db_user: {
    id: string;
    name: string;
    email: string;
    access_level: string;
    company_id: string | null;
    area_id: string | null;
  }): User {
    return {
      ...db_user,
      access_level: db_user.access_level as AccessLevel,
    };
  }

  async get_leads_by_company(company_id: string, filter: DateFilter): Promise<Lead[]> {
    const { start, end } = get_date_range(filter);
    const leads = await prisma.lead.findMany({
      where: {
        company_id,
        created_at: { gte: start, lte: end },
      },
    });
    return leads.map(l => this.map_lead(l));
  }

  async get_leads_by_area(area_id: string, filter: DateFilter): Promise<Lead[]> {
    const { start, end } = get_date_range(filter);
    const leads = await prisma.lead.findMany({
      where: {
        area_id,
        created_at: { gte: start, lte: end },
      },
    });
    return leads.map(l => this.map_lead(l));
  }

  async get_leads_by_areas(area_ids: string[], filter: DateFilter): Promise<Lead[]> {
    const { start, end } = get_date_range(filter);
    const leads = await prisma.lead.findMany({
      where: {
        area_id: { in: area_ids },
        created_at: { gte: start, lte: end },
      },
    });
    return leads.map(l => this.map_lead(l));
  }

  async get_leads_by_seller(seller_id: string, filter: DateFilter): Promise<Lead[]> {
    const { start, end } = get_date_range(filter);
    const leads = await prisma.lead.findMany({
      where: {
        seller_id,
        created_at: { gte: start, lte: end },
      },
    });
    return leads.map(l => this.map_lead(l));
  }

  async get_users_by_company(company_id: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { company_id },
      select: {
        id: true,
        name: true,
        email: true,
        access_level: true,
        company_id: true,
        area_id: true,
      },
    });
    return users.map(u => this.map_user(u));
  }

  async get_users_by_area(area_id: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { area_id },
      select: {
        id: true,
        name: true,
        email: true,
        access_level: true,
        company_id: true,
        area_id: true,
      },
    });
    return users.map(u => this.map_user(u));
  }

  async get_users_by_areas(area_ids: string[]): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { area_id: { in: area_ids } },
      select: {
        id: true,
        name: true,
        email: true,
        access_level: true,
        company_id: true,
        area_id: true,
      },
    });
    return users.map(u => this.map_user(u));
  }

  async get_areas_by_company(company_id: string): Promise<Area[]> {
    return prisma.area.findMany({
      where: { company_id, is_active: true },
      select: {
        id: true,
        name: true,
        company_id: true,
      },
    });
  }

  async get_area(area_id: string): Promise<Area | null> {
    return prisma.area.findUnique({
      where: { id: area_id },
      select: {
        id: true,
        name: true,
        company_id: true,
      },
    });
  }

  async has_level_in_company(company_id: string, level: AccessLevel): Promise<boolean> {
    const users = await prisma.user.findMany({
      where: {
        company_id,
        status: "ACTIVE",
      },
      select: { access_level: true },
    });
    return users.some(u => u.access_level === level);
  }

  async get_team_metrics(seller_ids: string[]): Promise<TeamMetrics> {
    const five_minutes_ago = new Date(Date.now() - 5 * 60 * 1000);
    const today_start = new Date();
    today_start.setHours(0, 0, 0, 0);

    const [online_sessions, conversations, messages, playbook_scores] = await Promise.all([
      prisma.session.findMany({
        where: {
          user_id: { in: seller_ids },
          is_online: true,
          last_heartbeat: { gte: five_minutes_ago },
        },
        select: { user_id: true },
      }),
      prisma.conversation.findMany({
        where: { seller_id: { in: seller_ids } },
        select: { id: true, seller_id: true, status: true, created_at: true },
      }),
      prisma.message.findMany({
        where: {
          sender_type: "SELLER",
          response_time: { not: null },
          conversation: { seller_id: { in: seller_ids } },
        },
        select: { response_time: true },
      }),
      prisma.playbookScore.findMany({
        where: { seller_id: { in: seller_ids } },
        select: { score: true },
      }),
    ]);

    const online_seller_ids = new Set(online_sessions.map(s => s.user_id));
    const new_conversations = conversations.filter(c => c.created_at >= today_start).length;
    const waiting_response = conversations.filter(c => c.status === "WAITING_RESPONSE").length;

    const response_times = messages.map(m => m.response_time).filter((t): t is number => t !== null);
    const avg_response_time = response_times.length > 0
      ? Math.round(response_times.reduce((a, b) => a + b, 0) / response_times.length)
      : 0;

    const scores = playbook_scores.map(s => s.score);
    const avg_playbook_score = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

    return {
      sellers_online: online_seller_ids.size,
      sellers_offline: seller_ids.length - online_seller_ids.size,
      new_conversations,
      avg_response_time,
      avg_playbook_score,
      leads_without_response: waiting_response,
    };
  }

  async get_seller_ranking(seller_ids: string[]): Promise<SellerRanking[]> {
    const five_minutes_ago = new Date(Date.now() - 5 * 60 * 1000);
    const today_start = new Date();
    today_start.setHours(0, 0, 0, 0);

    const [sellers, online_sessions, conversations, messages, playbook_scores, leads] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: seller_ids }, access_level: "SELLER" },
        select: { id: true, name: true },
      }),
      prisma.session.findMany({
        where: {
          user_id: { in: seller_ids },
          is_online: true,
          last_heartbeat: { gte: five_minutes_ago },
        },
        select: { user_id: true },
      }),
      prisma.conversation.findMany({
        where: { seller_id: { in: seller_ids } },
        select: { id: true, seller_id: true, status: true, created_at: true },
      }),
      prisma.message.findMany({
        where: {
          sender_type: "SELLER",
          response_time: { not: null },
          conversation: { seller_id: { in: seller_ids } },
        },
        select: { response_time: true, conversation: { select: { seller_id: true } } },
      }),
      prisma.playbookScore.findMany({
        where: { seller_id: { in: seller_ids } },
        select: { score: true, seller_id: true },
      }),
      prisma.lead.findMany({
        where: { seller_id: { in: seller_ids } },
        select: { seller_id: true, status: true },
      }),
    ]);

    const online_seller_ids = new Set(online_sessions.map(s => s.user_id));

    return sellers.map(seller => {
      const seller_conversations = conversations.filter(c => c.seller_id === seller.id);
      const seller_messages = messages.filter(m => m.conversation.seller_id === seller.id);
      const seller_scores = playbook_scores.filter(s => s.seller_id === seller.id);
      const seller_leads = leads.filter(l => l.seller_id === seller.id);

      const new_conversations = seller_conversations.filter(c => c.created_at >= today_start).length;
      const response_times = seller_messages.map(m => m.response_time).filter((t): t is number => t !== null);
      const avg_response_time = response_times.length > 0
        ? Math.round(response_times.reduce((a, b) => a + b, 0) / response_times.length)
        : 0;

      const scores = seller_scores.map(s => s.score);
      const playbook_score = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

      const leads_without_response = seller_conversations.filter(c => c.status === "WAITING_RESPONSE").length;
      const sold_leads = seller_leads.filter(l => l.status === "SOLD").length;
      const conversion_rate = seller_leads.length > 0
        ? Math.round((sold_leads / seller_leads.length) * 1000) / 10
        : 0;

      return {
        id: seller.id,
        name: seller.name,
        is_online: online_seller_ids.has(seller.id),
        new_conversations,
        avg_response_time,
        playbook_score,
        leads_without_response,
        total_leads: seller_leads.length,
        conversion_rate,
      };
    });
  }
}
