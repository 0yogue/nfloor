"use client";

import { useState } from "react";
import { LeadFull, LeadTemperature, TEMPERATURE_CONFIG } from "@/types/leads";
import { LeadListItem } from "./lead-list-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadListProps {
  leads: LeadFull[];
  selected_lead: LeadFull | null;
  on_select: (lead: LeadFull) => void;
  on_import_click: () => void;
}

export function LeadList({ leads, selected_lead, on_select, on_import_click }: LeadListProps) {
  const [search, set_search] = useState("");
  const [temp_filter, set_temp_filter] = useState<LeadTemperature | "ALL">("ALL");

  const filtered_leads = leads.filter(lead => {
    const matches_search =
      search === "" ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.property_interest?.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search);

    const matches_temp = temp_filter === "ALL" || lead.temperature === temp_filter;

    return matches_search && matches_temp;
  });

  const sorted_leads = [...filtered_leads].sort((a, b) => {
    const temp_order = { HOT: 0, WARM: 1, COOLING: 2, COLD: 3 };
    const temp_diff = temp_order[a.temperature] - temp_order[b.temperature];
    if (temp_diff !== 0) return temp_diff;

    const a_time = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const b_time = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return b_time - a_time;
  });

  const temp_counts = leads.reduce(
    (acc, lead) => {
      acc[lead.temperature] = (acc[lead.temperature] || 0) + 1;
      return acc;
    },
    {} as Record<LeadTemperature, number>
  );

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lead..."
              value={search}
              onChange={e => set_search(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={on_import_click}>
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <Button
            variant={temp_filter === "ALL" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={() => set_temp_filter("ALL")}
          >
            Todos ({leads.length})
          </Button>
          {Object.entries(TEMPERATURE_CONFIG).map(([temp, config]) => (
            <Button
              key={temp}
              variant={temp_filter === temp ? "default" : "ghost"}
              size="sm"
              className={cn("h-7 text-xs shrink-0 gap-1", temp_filter !== temp && config.color)}
              onClick={() => set_temp_filter(temp as LeadTemperature)}
            >
              <div className={cn("w-2 h-2 rounded-full", config.bgColor)} />
              {config.label} ({temp_counts[temp as LeadTemperature] || 0})
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {sorted_leads.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {search || temp_filter !== "ALL" ? "Nenhum lead encontrado" : "Nenhum lead cadastrado"}
          </div>
        ) : (
          sorted_leads.map(lead => (
            <LeadListItem
              key={lead.id}
              lead={lead}
              is_selected={selected_lead?.id === lead.id}
              on_select={on_select}
            />
          ))
        )}
      </ScrollArea>

      <div className="p-3 border-t">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={on_import_click}>
          <Plus className="h-4 w-4" />
          Importar Leads
        </Button>
      </div>
    </div>
  );
}
