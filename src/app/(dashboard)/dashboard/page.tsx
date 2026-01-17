"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Phone, RefreshCw } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ACCESS_LEVEL_LABELS, Feature, AccessLevel } from "@/types/rbac";
import { cn } from "@/lib/utils";
import { SubordinatesTable } from "@/components/dashboard/subordinates-table";
import { TeamMetricsCards } from "@/components/dashboard/team-metrics-cards";
import { SellerRankingTable } from "@/components/dashboard/seller-ranking";
import { SalesFunnel } from "@/components/dashboard/sales-funnel";

interface ImprovementSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

function get_improvement_suggestions(
  metrics: LeadMetrics,
  team_metrics?: TeamMetrics
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  
  const total_leads = metrics.new_count + metrics.qualified_count + metrics.callback_count + metrics.proposal_count + metrics.sold_count;
  const conversion_rate = total_leads > 0 ? (metrics.sold_count / metrics.new_count) * 100 : 0;
  const qualification_rate = metrics.new_count > 0 ? (metrics.qualified_count / metrics.new_count) * 100 : 0;
  const proposal_rate = metrics.qualified_count > 0 ? (metrics.proposal_count / metrics.qualified_count) * 100 : 0;
  
  if (metrics.new_count > 0 && qualification_rate < 30) {
    suggestions.push({
      title: "Baixa Taxa de Qualificação",
      description: `Apenas ${qualification_rate.toFixed(0)}% dos novos leads são qualificados. Revise os critérios de entrada.`,
      priority: "high",
    });
  }
  
  if (metrics.callback_count > metrics.qualified_count * 0.5) {
    suggestions.push({
      title: "Muitos Leads em Retorno",
      description: `${metrics.callback_count} leads aguardando retorno. Priorize o follow-up.`,
      priority: "high",
    });
  }
  
  if (team_metrics && team_metrics.leads_without_response > 0) {
    suggestions.push({
      title: "Leads Sem Resposta",
      description: `${team_metrics.leads_without_response} leads ainda não foram contatados.`,
      priority: "high",
    });
  }
  
  if (team_metrics && team_metrics.avg_response_time > 30) {
    suggestions.push({
      title: "Tempo de Resposta Alto",
      description: `Média de ${team_metrics.avg_response_time} min. Meta: < 15 minutos.`,
      priority: "medium",
    });
  }
  
  if (conversion_rate < 5 && metrics.new_count > 10) {
    suggestions.push({
      title: "Taxa de Conversão Baixa",
      description: `Conversão de ${conversion_rate.toFixed(1)}%. Analise o funil de vendas.`,
      priority: "medium",
    });
  }
  
  if (proposal_rate < 40 && metrics.qualified_count > 5) {
    suggestions.push({
      title: "Poucas Propostas Enviadas",
      description: `Apenas ${proposal_rate.toFixed(0)}% dos qualificados recebem proposta.`,
      priority: "medium",
    });
  }
  
  if (team_metrics && team_metrics.avg_playbook_score < 70) {
    suggestions.push({
      title: "Score de Playbook Baixo",
      description: `Média de ${team_metrics.avg_playbook_score}%. Reforce treinamento.`,
      priority: "low",
    });
  }
  
  if (suggestions.length === 0) {
    suggestions.push({
      title: "Métricas Saudáveis",
      description: "Todas as métricas estão dentro do esperado. Continue o bom trabalho!",
      priority: "low",
    });
  }
  
  return suggestions.slice(0, 5);
}

interface LeadMetrics {
  new_count: number;
  qualified_count: number;
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

interface DashboardData {
  user_metrics: LeadMetrics;
  team_metrics: TeamMetrics;
  subordinates: SubordinateMetrics[];
  seller_ranking: SellerRanking[];
  total_metrics: LeadMetrics;
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
    new_count: 0,
    qualified_count: 0,
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

      {user.access_level !== AccessLevel.SELLER && (dashboard_data?.seller_ranking?.length || 0) > 0 && (
        <SellerRankingTable
          ranking={dashboard_data?.seller_ranking || []}
          is_loading={is_loading}
        />
      )}

      {(dashboard_data?.subordinates?.length || 0) > 0 && (
        <SubordinatesTable
          subordinates={dashboard_data?.subordinates || []}
          is_loading={is_loading}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <SalesFunnel
          metrics={dashboard_data?.total_metrics || empty_metrics}
          is_loading={is_loading}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Melhorias</CardTitle>
            <CardDescription>Métricas que precisam de atenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {get_improvement_suggestions(dashboard_data?.total_metrics || empty_metrics, dashboard_data?.team_metrics).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                      item.priority === "high" && "bg-red-500",
                      item.priority === "medium" && "bg-amber-500",
                      item.priority === "low" && "bg-blue-500"
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ligue Hoje</CardTitle>
            <CardDescription>
              Leads prioritários ordenados por temperatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Maria Silva", temp: "hot", last_contact: "2 dias", interest: "Apto 3 quartos" },
                { name: "João Santos", temp: "hot", last_contact: "1 dia", interest: "Casa em condomínio" },
                { name: "Ana Costa", temp: "warm", last_contact: "3 dias", interest: "Cobertura" },
                { name: "Pedro Lima", temp: "warm", last_contact: "4 dias", interest: "Terreno" },
                { name: "Carla Souza", temp: "cooling", last_contact: "5 dias", interest: "Apto 2 quartos" },
              ].map((lead, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        lead.temp === "hot" && "bg-green-500",
                        lead.temp === "warm" && "bg-yellow-500",
                        lead.temp === "cooling" && "bg-orange-500"
                      )}
                    />
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.interest}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Último contato</p>
                      <p className="text-sm">{lead.last_contact}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
