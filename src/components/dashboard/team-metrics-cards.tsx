"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Star, 
  UserPlus,
  Clock,
  Timer,
  UserX
} from "lucide-react";
import { TeamMetrics } from "@/lib/dashboard/types";

interface TeamMetricsCardsProps {
  metrics: TeamMetrics;
  is_loading?: boolean;
}

function format_response_time(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
}

export function TeamMetricsCards({ metrics, is_loading }: TeamMetricsCardsProps) {
  const cards = [
    {
      title: "Novos Leads",
      value: metrics.new_leads,
      subtitle: `${metrics.reactivated_conversations} conversas reativadas`,
      icon: UserPlus,
      color: "text-blue-500",
      bg_color: "bg-blue-500/10",
    },
    {
      title: "Nota Média Atendimento",
      value: metrics.avg_attendance_score.toFixed(1),
      is_text: true,
      subtitle: `${metrics.new_conversations} novas conversas`,
      icon: Star,
      color: metrics.avg_attendance_score >= 8 ? "text-green-500" : metrics.avg_attendance_score >= 6 ? "text-amber-500" : "text-red-500",
      bg_color: metrics.avg_attendance_score >= 8 ? "bg-green-500/10" : metrics.avg_attendance_score >= 6 ? "bg-amber-500/10" : "bg-red-500/10",
    },
    {
      title: "Tempo Médio de Primeira Resposta",
      value: format_response_time(metrics.avg_first_response_time),
      is_text: true,
      subtitle: "Tempo médio ponderado de resposta",
      icon: Clock,
      color: metrics.avg_first_response_time <= 300 ? "text-green-500" : metrics.avg_first_response_time <= 600 ? "text-amber-500" : "text-red-500",
      bg_color: metrics.avg_first_response_time <= 300 ? "bg-green-500/10" : metrics.avg_first_response_time <= 600 ? "bg-amber-500/10" : "bg-red-500/10",
    },
    {
      title: "Tempo Médio de Resposta",
      value: format_response_time(metrics.avg_weighted_response_time),
      is_text: true,
      subtitle: "Taxa média ponderada de resposta",
      icon: Timer,
      color: metrics.avg_weighted_response_time <= 600 ? "text-green-500" : metrics.avg_weighted_response_time <= 1200 ? "text-amber-500" : "text-red-500",
      bg_color: metrics.avg_weighted_response_time <= 600 ? "bg-green-500/10" : metrics.avg_weighted_response_time <= 1200 ? "bg-amber-500/10" : "bg-red-500/10",
    },
    {
      title: "Cliente sem resposta +2h",
      value: metrics.clients_no_response_2h,
      subtitle: "Conversas aguardando resposta do vendedor",
      icon: UserX,
      color: metrics.clients_no_response_2h === 0 ? "text-green-500" : metrics.clients_no_response_2h <= 5 ? "text-amber-500" : "text-red-500",
      bg_color: metrics.clients_no_response_2h === 0 ? "bg-green-500/10" : metrics.clients_no_response_2h <= 5 ? "bg-amber-500/10" : "bg-red-500/10",
    },
    {
      title: "Cliente Sem Resposta 24h",
      value: metrics.clients_no_response_24h,
      subtitle: `${metrics.conversations_with_activity} conversas com atividade no período`,
      icon: UserX,
      color: metrics.clients_no_response_24h === 0 ? "text-green-500" : metrics.clients_no_response_24h <= 5 ? "text-amber-500" : "text-red-500",
      bg_color: metrics.clients_no_response_24h === 0 ? "bg-green-500/10" : metrics.clients_no_response_24h <= 5 ? "bg-amber-500/10" : "bg-red-500/10",
    },
  ];

  const top_row_cards = cards.slice(0, 2);
  const bottom_row_cards = cards.slice(2);

  const online_names = metrics.online_sellers?.map(s => s.name).join(", ");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-muted-foreground">Métricas do Time</h3>
      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Online agora:</span>{" "}
        {metrics.sellers_online} vendedor(es)
        {online_names ? ` — ${online_names}` : ""}
        {metrics.sellers_offline > 0 ? ` (${metrics.sellers_offline} offline)` : ""}
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-2">
          {top_row_cards.map((card) => (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bg_color}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {is_loading ? (
                  <div className="h-8 w-16 animate-pulse bg-muted rounded" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.subtitle && (
                      <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {bottom_row_cards.map((card) => (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bg_color}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {is_loading ? (
                  <div className="h-8 w-16 animate-pulse bg-muted rounded" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.subtitle && (
                      <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
