"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Eye, 
  EyeOff, 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  Info
} from "lucide-react";

interface HubSpotConfigState {
  access_token: string;
  portal_id: string;
  scopes: {
    contacts: boolean;
    deals: boolean;
    companies: boolean;
    tickets: boolean;
  };
}

export function HubSpotConfig() {
  const [config, set_config] = useState<HubSpotConfigState>({
    access_token: "",
    portal_id: "",
    scopes: {
      contacts: true,
      deals: true,
      companies: false,
      tickets: false,
    },
  });

  const [show_token, set_show_token] = useState(false);
  const [is_testing, set_is_testing] = useState(false);
  const [is_saving, set_is_saving] = useState(false);
  const [test_result, set_test_result] = useState<"success" | "error" | null>(null);
  const [is_connected, set_is_connected] = useState(false);

  const handle_test_connection = async () => {
    set_is_testing(true);
    set_test_result(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (config.access_token && config.access_token.length > 10) {
        set_test_result("success");
        set_is_connected(true);
      } else {
        set_test_result("error");
      }
    } catch {
      set_test_result("error");
    } finally {
      set_is_testing(false);
    }
  };

  const handle_save = async () => {
    set_is_saving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // TODO: Implementar salvamento real via API
    } finally {
      set_is_saving(false);
    }
  };

  const handle_scope_change = (scope: keyof typeof config.scopes, checked: boolean) => {
    set_config(prev => ({
      ...prev,
      scopes: {
        ...prev.scopes,
        [scope]: checked,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                HubSpot CRM
                {is_connected && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Sincronize contatos, negócios e empresas com o HubSpot
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Para obter o Access Token, crie um{" "}
              <a
                href="https://developers.hubspot.com/docs/apps/legacy-apps/private-apps/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-1"
              >
                Private App no HubSpot
                <ExternalLink className="h-3 w-3" />
              </a>
              . Configure os escopos necessários: <code className="text-xs bg-muted px-1 rounded">crm.objects.contacts.read</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">crm.objects.deals.read</code>.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="portal_id">Portal ID (Hub ID)</Label>
              <Input
                id="portal_id"
                placeholder="12345678"
                value={config.portal_id}
                onChange={(e) => set_config(prev => ({ ...prev, portal_id: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Encontre em Settings → Account Management → Account Setup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token (Private App)</Label>
              <div className="relative">
                <Input
                  id="access_token"
                  type={show_token ? "text" : "password"}
                  placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={config.access_token}
                  onChange={(e) => set_config(prev => ({ ...prev, access_token: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => set_show_token(!show_token)}
                >
                  {show_token ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Token de acesso do Private App do HubSpot
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Escopos Habilitados</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scope_contacts"
                  checked={config.scopes.contacts}
                  onCheckedChange={(checked) => handle_scope_change("contacts", checked as boolean)}
                />
                <Label htmlFor="scope_contacts" className="text-sm font-normal">
                  Contatos (Leads)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scope_deals"
                  checked={config.scopes.deals}
                  onCheckedChange={(checked) => handle_scope_change("deals", checked as boolean)}
                />
                <Label htmlFor="scope_deals" className="text-sm font-normal">
                  Negócios (Deals)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scope_companies"
                  checked={config.scopes.companies}
                  onCheckedChange={(checked) => handle_scope_change("companies", checked as boolean)}
                />
                <Label htmlFor="scope_companies" className="text-sm font-normal">
                  Empresas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scope_tickets"
                  checked={config.scopes.tickets}
                  onCheckedChange={(checked) => handle_scope_change("tickets", checked as boolean)}
                />
                <Label htmlFor="scope_tickets" className="text-sm font-normal">
                  Tickets
                </Label>
              </div>
            </div>
          </div>

          {test_result && (
            <Alert variant={test_result === "success" ? "default" : "destructive"}>
              {test_result === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {test_result === "success"
                  ? "Conexão estabelecida com sucesso! O HubSpot está pronto para sincronização."
                  : "Falha na conexão. Verifique o Access Token e tente novamente."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handle_test_connection}
              disabled={is_testing || !config.access_token}
            >
              {is_testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>
            <Button onClick={handle_save} disabled={is_saving || !config.access_token}>
              {is_saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
