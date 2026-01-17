"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Mail, Plus, Trash2, Check, X, Filter } from "lucide-react";
import { PORTAL_CONFIGS, EmailFilter } from "@/types/integrations";
import { cn } from "@/lib/utils";

interface PortalToggle {
  id: string;
  enabled: boolean;
}

export function EmailIntegration() {
  const [enabled_portals, set_enabled_portals] = useState<PortalToggle[]>(
    PORTAL_CONFIGS.map(p => ({ id: p.id, enabled: true }))
  );
  const [custom_filters, set_custom_filters] = useState<EmailFilter[]>([]);
  const [new_filter, set_new_filter] = useState({ type: "sender" as "sender" | "subject", pattern: "" });

  function toggle_portal(portal_id: string) {
    set_enabled_portals(prev =>
      prev.map(p => (p.id === portal_id ? { ...p, enabled: !p.enabled } : p))
    );
  }

  function add_filter() {
    if (!new_filter.pattern.trim()) return;

    set_custom_filters(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        type: new_filter.type,
        pattern: new_filter.pattern.trim(),
        is_regex: false,
      },
    ]);
    set_new_filter({ type: "sender", pattern: "" });
  }

  function remove_filter(filter_id: string) {
    set_custom_filters(prev => prev.filter(f => f.id !== filter_id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Integração de Email
        </CardTitle>
        <CardDescription>
          Configure os portais e filtros para importar leads automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <span>Portais Imobiliários</span>
            <Badge variant="secondary">{enabled_portals.filter(p => p.enabled).length} ativos</Badge>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PORTAL_CONFIGS.map(portal => {
              const is_enabled = enabled_portals.find(p => p.id === portal.id)?.enabled ?? true;
              return (
                <div
                  key={portal.id}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg transition-colors",
                    is_enabled ? "bg-background" : "bg-muted/50 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{portal.logo}</span>
                    <div>
                      <p className="font-medium text-sm">{portal.name}</p>
                      <p className="text-xs text-muted-foreground">{portal.domain}</p>
                    </div>
                  </div>
                  <Switch checked={is_enabled} onCheckedChange={() => toggle_portal(portal.id)} />
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros Personalizados
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione filtros customizados para capturar leads de outras fontes
          </p>

          <div className="flex gap-2 mb-4">
            <select
              value={new_filter.type}
              onChange={e => set_new_filter(prev => ({ ...prev, type: e.target.value as "sender" | "subject" }))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="sender">Remetente contém</option>
              <option value="subject">Assunto contém</option>
            </select>
            <Input
              placeholder="Ex: portal.com.br ou 'Novo lead'"
              value={new_filter.pattern}
              onChange={e => set_new_filter(prev => ({ ...prev, pattern: e.target.value }))}
              className="flex-1"
              onKeyDown={e => e.key === "Enter" && add_filter()}
            />
            <Button onClick={add_filter} size="icon" disabled={!new_filter.pattern.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {custom_filters.length > 0 && (
            <div className="space-y-2">
              {custom_filters.map(filter => (
                <div
                  key={filter.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {filter.type === "sender" ? "Remetente" : "Assunto"}
                    </Badge>
                    <span className="text-sm">{filter.pattern}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove_filter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {custom_filters.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhum filtro personalizado adicionado
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancelar</Button>
          <Button className="gap-2">
            <Check className="h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
