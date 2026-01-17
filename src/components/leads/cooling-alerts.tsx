"use client";

import { useState, useEffect } from "react";
import { LeadFull, TEMPERATURE_CONFIG } from "@/types/leads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Thermometer,
  Clock,
  Phone,
  MessageCircle,
  X,
  Bell,
  BellOff,
} from "lucide-react";

interface CoolingAlertsProps {
  on_lead_click?: (lead: LeadFull) => void;
}

export function CoolingAlerts({ on_lead_click }: CoolingAlertsProps) {
  const [alerts, set_alerts] = useState<LeadFull[]>([]);
  const [dismissed, set_dismissed] = useState<Set<string>>(new Set());
  const [is_loading, set_is_loading] = useState(true);
  const [notifications_enabled, set_notifications_enabled] = useState(true);

  useEffect(() => {
    fetch_cooling_leads();
    const interval = setInterval(fetch_cooling_leads, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetch_cooling_leads() {
    try {
      const response = await fetch("/api/leads/cooling");
      const data = await response.json();
      if (data.success) {
        set_alerts(data.data.filter((l: LeadFull) => !dismissed.has(l.id)));
      }
    } catch (error) {
      console.error("Error fetching cooling leads:", error);
    } finally {
      set_is_loading(false);
    }
  }

  function dismiss_alert(lead_id: string) {
    set_dismissed(prev => new Set([...prev, lead_id]));
    set_alerts(prev => prev.filter(l => l.id !== lead_id));
  }

  const visible_alerts = alerts.filter(l => !dismissed.has(l.id));

  if (visible_alerts.length === 0 && !is_loading) {
    return null;
  }

  return (
    <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-700 dark:text-yellow-500">
              Leads Esfriando
            </CardTitle>
            {visible_alerts.length > 0 && (
              <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                {visible_alerts.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => set_notifications_enabled(!notifications_enabled)}
            className="text-yellow-600"
          >
            {notifications_enabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Leads que estavam quentes e não tiveram contato recente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {is_loading ? (
          <div className="py-4 text-center text-muted-foreground text-sm">
            Verificando leads...
          </div>
        ) : (
          <div className="space-y-2">
            {visible_alerts.map(lead => (
              <CoolingAlertItem
                key={lead.id}
                lead={lead}
                on_click={() => on_lead_click?.(lead)}
                on_dismiss={() => dismiss_alert(lead.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CoolingAlertItemProps {
  lead: LeadFull;
  on_click: () => void;
  on_dismiss: () => void;
}

function CoolingAlertItem({ lead, on_click, on_dismiss }: CoolingAlertItemProps) {
  const time_ago = lead.last_contact_at
    ? formatDistanceToNow(new Date(lead.last_contact_at), { addSuffix: true, locale: ptBR })
    : "sem contato";

  const hours = lead.hours_without_response ?? 0;
  const urgency = hours > 48 ? "high" : hours > 24 ? "medium" : "low";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        urgency === "high"
          ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
          : urgency === "medium"
          ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
          : "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
      )}
    >
      <button onClick={on_click} className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <Thermometer
            className={cn(
              "h-4 w-4 shrink-0",
              urgency === "high"
                ? "text-red-500"
                : urgency === "medium"
                ? "text-yellow-600"
                : "text-orange-500"
            )}
          />
          <span className="font-medium truncate">{lead.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Último contato {time_ago}</span>
          {hours > 24 && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                urgency === "high" ? "border-red-300 text-red-600" : "border-yellow-300 text-yellow-700"
              )}
            >
              {Math.round(hours)}h sem resposta
            </Badge>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1 shrink-0">
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={e => {
            e.stopPropagation();
            on_dismiss();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
