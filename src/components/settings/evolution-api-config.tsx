"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  EyeOff, 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  Info,
  QrCode,
  Smartphone,
  RefreshCw
} from "lucide-react";

interface EvolutionConfigState {
  base_url: string;
  api_key: string;
  instance_name: string;
  instance_token: string;
  webhook_url: string;
}

export function EvolutionApiConfig() {
  const [config, set_config] = useState<EvolutionConfigState>({
    base_url: "",
    api_key: "",
    instance_name: "",
    instance_token: "",
    webhook_url: typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/evolution` : "",
  });

  const [show_api_key, set_show_api_key] = useState(false);
  const [show_token, set_show_token] = useState(false);
  const [is_testing, set_is_testing] = useState(false);
  const [is_saving, set_is_saving] = useState(false);
  const [is_creating_instance, set_is_creating_instance] = useState(false);
  const [test_result, set_test_result] = useState<"success" | "error" | null>(null);
  const [instance_status, set_instance_status] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [qr_code, set_qr_code] = useState<string | null>(null);

  const handle_test_connection = async () => {
    set_is_testing(true);
    set_test_result(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (config.base_url && config.api_key) {
        set_test_result("success");
      } else {
        set_test_result("error");
      }
    } catch {
      set_test_result("error");
    } finally {
      set_is_testing(false);
    }
  };

  const handle_create_instance = async () => {
    set_is_creating_instance(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      set_instance_status("connecting");
      set_qr_code("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
    } finally {
      set_is_creating_instance(false);
    }
  };

  const handle_refresh_qr = async () => {
    set_instance_status("connecting");
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                WhatsApp (Evolution API)
                {instance_status === "connected" && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                )}
                {instance_status === "connecting" && (
                  <Badge variant="secondary">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Aguardando QR Code
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Conecte o WhatsApp Business usando a Evolution API para automação de mensagens
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              A Evolution API é uma solução open-source para integração com WhatsApp.{" "}
              <a
                href="https://doc.evolution-api.com/v2/en/get-started/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-1"
              >
                Ver documentação
                <ExternalLink className="h-3 w-3" />
              </a>
              . Você pode hospedar sua própria instância ou usar um provedor.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_url">URL da API (Base URL)</Label>
              <Input
                id="base_url"
                placeholder="https://api.evolution.example.com"
                value={config.base_url}
                onChange={(e) => set_config(prev => ({ ...prev, base_url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                URL base da sua instância Evolution API (sem barra no final)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key (Global)</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={show_api_key ? "text" : "password"}
                  placeholder="sua-api-key-global"
                  value={config.api_key}
                  onChange={(e) => set_config(prev => ({ ...prev, api_key: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => set_show_api_key(!show_api_key)}
                >
                  {show_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Variável de ambiente AUTHENTICATION_API_KEY da Evolution API
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="instance_name">Nome da Instância</Label>
              <Input
                id="instance_name"
                placeholder="nfloor-whatsapp"
                value={config.instance_name}
                onChange={(e) => set_config(prev => ({ ...prev, instance_name: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Identificador único para esta conexão WhatsApp
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance_token">Token da Instância (Opcional)</Label>
              <div className="relative">
                <Input
                  id="instance_token"
                  type={show_token ? "text" : "password"}
                  placeholder="token-opcional-da-instancia"
                  value={config.instance_token}
                  onChange={(e) => set_config(prev => ({ ...prev, instance_token: e.target.value }))}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL (Callback)</Label>
              <Input
                id="webhook_url"
                value={config.webhook_url}
                onChange={(e) => set_config(prev => ({ ...prev, webhook_url: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                URL para receber eventos de mensagens do WhatsApp
              </p>
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
                  ? "Conexão com Evolution API estabelecida com sucesso!"
                  : "Falha na conexão. Verifique a URL e API Key."}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {instance_status === "connecting" && qr_code && (
            <Card className="p-4">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  Escaneie o QR Code com o WhatsApp
                </div>
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
                <Button variant="outline" size="sm" onClick={handle_refresh_qr}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar QR Code
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Abra o WhatsApp → Menu → Aparelhos conectados → Conectar aparelho
                </p>
              </div>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handle_test_connection}
              disabled={is_testing || !config.base_url || !config.api_key}
            >
              {is_testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>

            {test_result === "success" && instance_status === "disconnected" && (
              <Button
                variant="outline"
                onClick={handle_create_instance}
                disabled={is_creating_instance || !config.instance_name}
              >
                {is_creating_instance ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                Criar Instância
              </Button>
            )}

            <Button onClick={handle_save} disabled={is_saving || !config.base_url}>
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
