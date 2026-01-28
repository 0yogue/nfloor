"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ACCESS_LEVEL_LABELS, Feature, AccessLevel } from "@/types/rbac";
import { cn } from "@/lib/utils";
import { TeamMetricsCards } from "@/components/dashboard/team-metrics-cards";
import { SellerRankingTable } from "@/components/dashboard/seller-ranking";
import { SalesFunnel } from "@/components/dashboard/sales-funnel";
import { HierarchicalRanking } from "@/components/dashboard/hierarchical-ranking";

interface LeadMetrics {
  lead_count: number;
  visit_count: number;
  callback_count: number;
  proposal_count: number;
  sold_count: number;
}

interface TeamMetrics {
  sellers_online: number;
  sellers_offline: number;
  new_conversations: number;
  avg_response_time: number;
  avg_playbook_score: number;
  leads_without_response: number;
  avg_attendance_score: number;
  new_leads: number;
  reactivated_conversations: number;
  avg_first_response_time: number;
  avg_weighted_response_time: number;
  clients_no_response_2h: number;
  clients_no_response_24h: number;
  conversations_with_activity: number;
}

interface SellerRanking {
  id: string;
  name: string;
  is_online: boolean;
  new_conversations: number;
  avg_response_time: number;
  playbook_score: number;
  leads_without_response: number;
  total_leads: number;
  conversion_rate: number;
}

interface SubordinateMetrics {
  id: string;
  name: string;
  type: "superintendent" | "manager" | "seller" | "area";
  access_level?: string;
  metrics: LeadMetrics;
}

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  user_metrics: LeadMetrics;
  team_metrics: TeamMetrics;
  subordinates: SubordinateMetrics[];
  seller_ranking: SellerRanking[];
  total_metrics: LeadMetrics;
  leads?: Lead[];
  period: {
    start: string;
    end: string;
    label: string;
  };
}

type DateFilterType = "today" | "7days" | "30days" | "custom";

export default function DashboardPage() {
  const { user, has_feature } = useAuth();
  const [date_filter, set_date_filter] = useState<DateFilterType>("7days");
  const [custom_range, set_custom_range] = useState<DateRange | undefined>();

  const can_use_custom_filter = has_feature(Feature.DASHBOARD_FILTERS_CUSTOM);
  
  const [dashboard_data, set_dashboard_data] = useState<DashboardData | null>(null);
  const [is_loading, set_is_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);

  const fetch_metrics = useCallback(async () => {
    set_is_loading(true);
    set_error(null);
    
    try {
      const params = new URLSearchParams({ filter: date_filter });
      
      if (date_filter === "custom" && custom_range?.from && custom_range?.to) {
        params.set("start", custom_range.from.toISOString());
        params.set("end", custom_range.to.toISOString());
      }
      
      const response = await fetch(`/api/dashboard/metrics?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        set_dashboard_data(data.data);
      } else {
        set_error(data.error || "Erro ao carregar métricas");
      }
    } catch {
      set_error("Erro de conexão");
    } finally {
      set_is_loading(false);
    }
  }, [date_filter, custom_range]);

  useEffect(() => {
    if (user) {
      fetch_metrics();
    }
  }, [user, fetch_metrics]);

  const get_date_range = (): { from: Date; to: Date } => {
    const now = new Date();
    switch (date_filter) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "7days":
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case "30days":
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case "custom":
        if (custom_range?.from && custom_range?.to) {
          return { from: startOfDay(custom_range.from), to: endOfDay(custom_range.to) };
        }
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      default:
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
    }
  };

  const date_range = get_date_range();
  
  const empty_metrics: LeadMetrics = {
    lead_count: 0,
    visit_count: 0,
    callback_count: 0,
    proposal_count: 0,
    sold_count: 0,
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user.name} •{" "}
            <span className="text-primary">{ACCESS_LEVEL_LABELS[user.access_level]}</span>
            {user.area_name && (
              <span className="text-muted-foreground"> • {user.area_name}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs
            value={date_filter}
            onValueChange={(v) => set_date_filter(v as DateFilterType)}
          >
            <TabsList>
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="7days">7 dias</TabsTrigger>
              <TabsTrigger value="30days">30 dias</TabsTrigger>
              {can_use_custom_filter && (
                <TabsTrigger value="custom">Custom</TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {date_filter === "custom" && can_use_custom_filter && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {custom_range?.from ? (
                    custom_range.to ? (
                      <>
                        {format(custom_range.from, "dd/MM", { locale: ptBR })} -{" "}
                        {format(custom_range.to, "dd/MM", { locale: ptBR })}
                      </>
                    ) : (
                      format(custom_range.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Selecionar"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={custom_range?.from}
                  selected={custom_range}
                  onSelect={set_custom_range}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          )}

          {!can_use_custom_filter && (
            <Badge variant="secondary" className="text-xs">
              Custom: PRO
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetch_metrics}
            disabled={is_loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", is_loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Período: {format(date_range.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
          {format(date_range.to, "dd/MM/yyyy", { locale: ptBR })}
        </span>
        {dashboard_data?.period.label && (
          <Badge variant="outline">{dashboard_data.period.label}</Badge>
        )}
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {user.access_level !== AccessLevel.SELLER && dashboard_data?.team_metrics && (
        <TeamMetricsCards
          metrics={dashboard_data.team_metrics}
          is_loading={is_loading}
        />
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:basis-[30%]">
          <SalesFunnel
            metrics={dashboard_data?.total_metrics || empty_metrics}
            is_loading={is_loading}
          />
        </div>

        <div className="lg:basis-[70%]">
          <HierarchicalRanking
            access_level={user.access_level}
            subordinates={dashboard_data?.subordinates || []}
            leads={dashboard_data?.leads as any}
            is_loading={is_loading}
          />
        </div>
      </div>

      {user.access_level !== AccessLevel.SELLER && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(dashboard_data?.seller_ranking?.length || 0) > 0 && (
            <SellerRankingTable
              ranking={dashboard_data?.seller_ranking || []}
              is_loading={is_loading}
            />
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Atividades dos Vendedores</CardTitle>
              <CardDescription>Resumo das atividades recentes da equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground">Ligações Realizadas</span>
                  <span className="text-2xl font-bold text-blue-500">
                    {dashboard_data?.team_metrics?.new_conversations || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">hoje</span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground">Visitas Agendadas</span>
                  <span className="text-2xl font-bold text-purple-500">
                    {dashboard_data?.total_metrics?.visit_count || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">no período</span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground">Propostas Enviadas</span>
                  <span className="text-2xl font-bold text-orange-500">
                    {dashboard_data?.total_metrics?.proposal_count || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">no período</span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground">Leads Sem Resposta</span>
                  <span className="text-2xl font-bold text-red-500">
                    {dashboard_data?.team_metrics?.leads_without_response || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">aguardando</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
