"use client";

import { useState } from "react";
import { LeadFull } from "@/types/leads";
import { LeadListItem } from "./lead-list-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadListProps {
  leads: LeadFull[];
  selected_lead: LeadFull | null;
  on_select: (lead: LeadFull) => void;
  on_import_click: () => void;
}

type StatusFilter = "ALL" | "NEW" | "QUALIFIED" | "CALLBACK" | "PROPOSAL" | "SOLD" | "LOST";

const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
  { value: "ALL", label: "Todos", color: "" },
  { value: "NEW", label: "Novos", color: "bg-blue-500" },
  { value: "QUALIFIED", label: "Qualificados", color: "bg-cyan-500" },
  { value: "CALLBACK", label: "Retorno", color: "bg-amber-500" },
  { value: "PROPOSAL", label: "Proposta", color: "bg-orange-500" },
  { value: "SOLD", label: "Vendidos", color: "bg-green-500" },
];

export function LeadList({ leads, selected_lead, on_select, on_import_click }: LeadListProps) {
  const [search, set_search] = useState("");
  const [status_filter, set_status_filter] = useState<StatusFilter>("ALL");

  const filtered_leads = leads.filter(lead => {
    const matches_search =
      search === "" ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.email?.toLowerCase().includes(search.toLowerCase());

    const matches_status = status_filter === "ALL" || lead.status === status_filter;

    return matches_search && matches_status;
  });

  const sorted_leads = [...filtered_leads].sort((a, b) => {
    const a_time = a.created_at ? new Date(a.created_at).getTime() : 0;
    const b_time = b.created_at ? new Date(b.created_at).getTime() : 0;
    return b_time - a_time;
  });

  const status_counts = leads.reduce(
    (acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
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
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={status_filter === opt.value ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs shrink-0 gap-1"
              onClick={() => set_status_filter(opt.value)}
            >
              {opt.color && <div className={cn("w-2 h-2 rounded-full", opt.color)} />}
              {opt.label} ({opt.value === "ALL" ? leads.length : status_counts[opt.value] || 0})
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {sorted_leads.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {search || status_filter !== "ALL" ? "Nenhum lead encontrado" : "Nenhum lead cadastrado"}
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
