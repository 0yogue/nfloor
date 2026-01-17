"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  UserX, 
  MessageSquarePlus, 
  Clock, 
  Star, 
  MessageSquareOff 
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
      title: "Vendedores Online",
      value: metrics.sellers_online,
      subtitle: `${metrics.sellers_offline} offline`,
      icon: Users,
      color: "text-green-500",
      bg_color: "bg-green-500/10",
    },
    {
      title: "Novas Conversas",
      value: metrics.new_conversations,
      icon: MessageSquarePlus,
      color: "text-blue-500",
      bg_color: "bg-blue-500/10",
    },
    {
      title: "Tempo Médio Resposta",
      value: format_response_time(metrics.avg_response_time),
      is_text: true,
      icon: Clock,
      color: metrics.avg_response_time <= 300 ? "text-green-500" : metrics.avg_response_time <= 600 ? "text-amber-500" : "text-red-500",
      bg_color: metrics.avg_response_time <= 300 ? "bg-green-500/10" : metrics.avg_response_time <= 600 ? "bg-amber-500/10" : "bg-red-500/10",
    },
    {
      title: "Nota Média Playbook",
      value: metrics.avg_playbook_score.toFixed(1),
      is_text: true,
      icon: Star,
      color: metrics.avg_playbook_score >= 8 ? "text-green-500" : metrics.avg_playbook_score >= 6 ? "text-amber-500" : "text-red-500",
      bg_color: metrics.avg_playbook_score >= 8 ? "bg-green-500/10" : metrics.avg_playbook_score >= 6 ? "bg-amber-500/10" : "bg-red-500/10",
    },
    {
      title: "Sem Resposta",
      value: metrics.leads_without_response,
      icon: MessageSquareOff,
      color: metrics.leads_without_response === 0 ? "text-green-500" : metrics.leads_without_response <= 5 ? "text-amber-500" : "text-red-500",
      bg_color: metrics.leads_without_response === 0 ? "bg-green-500/10" : metrics.leads_without_response <= 5 ? "bg-amber-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-muted-foreground">Métricas do Time</h3>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
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
  );
}
