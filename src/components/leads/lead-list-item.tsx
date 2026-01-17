"use client";

import { LeadFull, LeadTemperature, LeadSource, TEMPERATURE_CONFIG, LEAD_SOURCE_LABELS } from "@/types/leads";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface LeadListItemProps {
  lead: LeadFull;
  is_selected: boolean;
  on_select: (lead: LeadFull) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  NEW: { label: "Novo", color: "text-blue-600", bgColor: "bg-blue-500" },
  QUALIFIED: { label: "Qualificado", color: "text-cyan-600", bgColor: "bg-cyan-500" },
  CALLBACK: { label: "Retorno", color: "text-amber-600", bgColor: "bg-amber-500" },
  PROPOSAL: { label: "Proposta", color: "text-orange-600", bgColor: "bg-orange-500" },
  SOLD: { label: "Vendido", color: "text-green-600", bgColor: "bg-green-500" },
  LOST: { label: "Perdido", color: "text-gray-600", bgColor: "bg-gray-500" },
};

export function LeadListItem({ lead, is_selected, on_select }: LeadListItemProps) {
  const temp_config = lead.temperature 
    ? TEMPERATURE_CONFIG[lead.temperature] 
    : null;
  const status_config = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  const source_label = lead.source ? LEAD_SOURCE_LABELS[lead.source] : null;
  
  const time_ago = lead.created_at
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })
    : "";

  return (
    <button
      onClick={() => on_select(lead)}
      className={cn(
        "w-full text-left p-3 border-b transition-colors hover:bg-accent/50",
        is_selected && "bg-accent border-l-2 border-l-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", status_config.bgColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{lead.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{time_ago}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {lead.phone || lead.email || "Sem contato"}
          </p>
          {lead.notes && (
            <p className="text-xs text-muted-foreground/70 truncate mt-1">
              📝 {lead.notes.substring(0, 50)}...
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs", status_config.color)}>{status_config.label}</span>
            {source_label && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{source_label}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
