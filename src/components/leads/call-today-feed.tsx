"use client";

import { useState, useEffect } from "react";
import { LeadFull, TEMPERATURE_CONFIG, LEAD_SOURCE_LABELS } from "@/types/leads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Phone,
  MessageCircle,
  Clock,
  Flame,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface CallTodayFeedProps {
  on_lead_click?: (lead: LeadFull) => void;
}

export function CallTodayFeed({ on_lead_click }: CallTodayFeedProps) {
  const [leads, set_leads] = useState<LeadFull[]>([]);
  const [is_loading, set_is_loading] = useState(true);

  useEffect(() => {
    fetch_priority_leads();
  }, []);

  async function fetch_priority_leads() {
    set_is_loading(true);
    try {
      const response = await fetch("/api/leads/priority");
      const data = await response.json();
      if (data.success) {
        set_leads(data.data);
      }
    } catch (error) {
      console.error("Error fetching priority leads:", error);
    } finally {
      set_is_loading(false);
    }
  }

  if (is_loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Flame className="h-5 w-5" />
              Ligue para Esses Hoje
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Sparkles className="h-3 w-3" />
              Ordenados por IA com base na temperatura
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetch_priority_leads}
            disabled={is_loading}
          >
            <RefreshCw className={cn("h-4 w-4", is_loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum lead prioritário no momento</p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-3">
              {leads.map((lead, index) => (
                <PriorityLeadCard
                  key={lead.id}
                  lead={lead}
                  rank={index + 1}
                  on_click={() => on_lead_click?.(lead)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface PriorityLeadCardProps {
  lead: LeadFull;
  rank: number;
  on_click: () => void;
}

function PriorityLeadCard({ lead, rank, on_click }: PriorityLeadCardProps) {
  const temp_config = lead.temperature ? TEMPERATURE_CONFIG[lead.temperature] : null;
  const time_ago = lead.last_contact_at
    ? formatDistanceToNow(new Date(lead.last_contact_at), { addSuffix: true, locale: ptBR })
    : lead.created_at
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })
    : "sem contato";

  return (
    <button
      onClick={on_click}
      className="w-full text-left p-3 border rounded-lg hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
            rank === 1
              ? "bg-orange-500 text-white"
              : rank === 2
              ? "bg-orange-400 text-white"
              : rank === 3
              ? "bg-orange-300 text-orange-900"
              : "bg-muted text-muted-foreground"
          )}
        >
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{lead.name}</span>
            {temp_config && <div className={cn("w-2 h-2 rounded-full shrink-0", temp_config.bgColor)} />}
          </div>

          <p className="text-sm text-muted-foreground truncate">
            {lead.property_interest?.neighborhood || "Sem imóvel"}
            {lead.property_interest?.city && `, ${lead.property_interest.city}`}
          </p>

          <div className="flex items-center gap-3 mt-2">
            {lead.source && (
              <Badge variant="outline" className="text-xs">
                {LEAD_SOURCE_LABELS[lead.source]}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {time_ago}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          {lead.phone && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={e => {
                e.stopPropagation();
                window.open(`tel:${lead.phone}`);
              }}
            >
              <Phone className="h-4 w-4 text-green-600" />
            </Button>
          )}
          {lead.phone && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={e => {
                e.stopPropagation();
                window.open(`https://wa.me/55${lead.phone?.replace(/\D/g, "")}`);
              }}
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
            </Button>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center" />
      </div>
    </button>
  );
}
