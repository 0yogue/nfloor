"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, PhoneCall, FileText, TrendingUp } from "lucide-react";

interface LeadMetrics {
  lead_count: number;
  visit_count: number;
  callback_count: number;
  proposal_count: number;
  sold_count: number;
}

interface MetricsCardsProps {
  metrics: LeadMetrics;
  title?: string;
  is_loading?: boolean;
}

export function MetricsCards({ metrics, title, is_loading }: MetricsCardsProps) {
  const cards = [
    {
      title: "Leads",
      value: metrics.lead_count,
      icon: Users,
      color: "text-blue-500",
      bg_color: "bg-blue-500/10",
    },
    {
      title: "Visitas",
      value: metrics.visit_count,
      icon: Eye,
      color: "text-purple-500",
      bg_color: "bg-purple-500/10",
    },
    {
      title: "Retorno",
      value: metrics.callback_count,
      icon: PhoneCall,
      color: "text-amber-500",
      bg_color: "bg-amber-500/10",
    },
    {
      title: "Proposta",
      value: metrics.proposal_count,
      icon: FileText,
      color: "text-orange-500",
      bg_color: "bg-orange-500/10",
    },
    {
      title: "Vendas",
      value: metrics.sold_count,
      icon: TrendingUp,
      color: "text-green-500",
      bg_color: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
      )}
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
                <div className="text-2xl font-bold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
