"use client";

import { LeadFull, TEMPERATURE_CONFIG, LEAD_SOURCE_LABELS } from "@/types/leads";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadListItemProps {
  lead: LeadFull;
  is_selected: boolean;
  on_select: (lead: LeadFull) => void;
}

export function LeadListItem({ lead, is_selected, on_select }: LeadListItemProps) {
  const temp_config = TEMPERATURE_CONFIG[lead.temperature];
  const time_ago = lead.last_message_at
    ? formatDistanceToNow(new Date(lead.last_message_at), { addSuffix: true, locale: ptBR })
    : "sem contato";

  return (
    <button
      onClick={() => on_select(lead)}
      className={cn(
        "w-full text-left p-3 border-b transition-colors hover:bg-accent/50",
        is_selected && "bg-accent border-l-2 border-l-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", temp_config.bgColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{lead.name}</span>
            {lead.hours_without_response && lead.hours_without_response > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                {lead.hours_without_response < 1
                  ? "agora"
                  : lead.hours_without_response < 24
                  ? `${Math.round(lead.hours_without_response)}h`
                  : `${Math.round(lead.hours_without_response / 24)}d`}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {lead.property_interest?.neighborhood || "Sem imóvel"}
            {lead.property_interest?.city && `, ${lead.property_interest.city}`}
          </p>
          {lead.last_message && (
            <p className="text-xs text-muted-foreground/70 truncate mt-1">
              💬 {lead.last_message}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs", temp_config.color)}>{temp_config.label}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{LEAD_SOURCE_LABELS[lead.source]}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
