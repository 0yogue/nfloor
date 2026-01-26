"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle, 
  Loader2,
  ExternalLink,
  Info,
  Mail,
  Calendar,
  LogIn
} from "lucide-react";

interface GoogleConfigState {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: {
    gmail_readonly: boolean;
    gmail_send: boolean;
    calendar_events: boolean;
    calendar_readonly: boolean;
  };
}

export function GoogleConfig() {
  const [config, set_config] = useState<GoogleConfigState>({
    client_id: "",
    client_secret: "",
    redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/api/auth/google/callback` : "",
    scopes: {
      gmail_readonly: true,
      gmail_send: true,
      calendar_events: true,
      calendar_readonly: false,
    },
  });

  const [show_secret, set_show_secret] = useState(false);
  const [is_saving, set_is_saving] = useState(false);
  const [is_connected, set_is_connected] = useState(false);
  const [connected_email, set_connected_email] = useState<string | null>(null);

  const handle_oauth_connect = () => {
    if (!config.client_id) {
      return;
    }

    const scopes = [];
    if (config.scopes.gmail_readonly) scopes.push("https://www.googleapis.com/auth/gmail.readonly");
    if (config.scopes.gmail_send) scopes.push("https://www.googleapis.com/auth/gmail.send");
    if (config.scopes.calendar_events) scopes.push("https://www.googleapis.com/auth/calendar.events");
    if (config.scopes.calendar_readonly) scopes.push("https://www.googleapis.com/auth/calendar.readonly");

    const oauth_url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    oauth_url.searchParams.set("client_id", config.client_id);
    oauth_url.searchParams.set("redirect_uri", config.redirect_uri);
    oauth_url.searchParams.set("response_type", "code");
    oauth_url.searchParams.set("scope", scopes.join(" "));
    oauth_url.searchParams.set("access_type", "offline");
    oauth_url.searchParams.set("prompt", "consent");

    window.open(oauth_url.toString(), "_blank", "width=500,height=600");
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
                Google (Gmail & Calendar)
                {is_connected && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Conecte Gmail para enviar emails e Calendar para agendar visitas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Configure as credenciais OAuth 2.0 no{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-1"
              >
                Google Cloud Console
                <ExternalLink className="h-3 w-3" />
              </a>
              . Habilite as APIs do Gmail e Calendar, e configure o URI de redirecionamento autorizado.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID</Label>
              <Input
                id="client_id"
                placeholder="123456789-xxxxxxxxx.apps.googleusercontent.com"
                value={config.client_id}
                onChange={(e) => set_config(prev => ({ ...prev, client_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_secret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="client_secret"
                  type={show_secret ? "text" : "password"}
                  placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                  value={config.client_secret}
                  onChange={(e) => set_config(prev => ({ ...prev, client_secret: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => set_show_secret(!show_secret)}
                >
                  {show_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect_uri">Redirect URI (Callback URL)</Label>
              <Input
                id="redirect_uri"
                value={config.redirect_uri}
                onChange={(e) => set_config(prev => ({ ...prev, redirect_uri: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Adicione este URI nas credenciais OAuth do Google Cloud Console
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Permissões (Scopes)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-sm">Gmail</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gmail_readonly"
                      checked={config.scopes.gmail_readonly}
                      onCheckedChange={(checked) => handle_scope_change("gmail_readonly", checked as boolean)}
                    />
                    <Label htmlFor="gmail_readonly" className="text-sm font-normal">
                      Ler emails (gmail.readonly)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gmail_send"
                      checked={config.scopes.gmail_send}
                      onCheckedChange={(checked) => handle_scope_change("gmail_send", checked as boolean)}
                    />
                    <Label htmlFor="gmail_send" className="text-sm font-normal">
                      Enviar emails (gmail.send)
                    </Label>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Calendar</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="calendar_events"
                      checked={config.scopes.calendar_events}
                      onCheckedChange={(checked) => handle_scope_change("calendar_events", checked as boolean)}
                    />
                    <Label htmlFor="calendar_events" className="text-sm font-normal">
                      Criar/editar eventos (calendar.events)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="calendar_readonly"
                      checked={config.scopes.calendar_readonly}
                      onCheckedChange={(checked) => handle_scope_change("calendar_readonly", checked as boolean)}
                    />
                    <Label htmlFor="calendar_readonly" className="text-sm font-normal">
                      Apenas leitura (calendar.readonly)
                    </Label>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {connected_email && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Conectado como <strong>{connected_email}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handle_oauth_connect}
              disabled={!config.client_id || !config.client_secret}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Conectar com Google
            </Button>
            <Button onClick={handle_save} disabled={is_saving || !config.client_id}>
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
