"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Smartphone, RefreshCw, Power, PowerOff, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppStatus {
  connected: boolean;
  instance?: {
    instanceName: string;
    state: "open" | "close" | "connecting";
    profileName?: string;
    number?: string;
  };
  config_required?: boolean;
}

interface QRCodeData {
  base64?: string;
  code?: string;
}

export function WhatsAppConnection() {
  const [status, set_status] = useState<WhatsAppStatus | null>(null);
  const [qr_code, set_qr_code] = useState<QRCodeData | null>(null);
  const [is_loading, set_is_loading] = useState(true);
  const [action_loading, set_action_loading] = useState<string | null>(null);

  useEffect(() => {
    check_status();
  }, []);

  async function check_status() {
    set_is_loading(true);
    try {
      const response = await fetch("/api/integrations/whatsapp");
      const data = await response.json();
      set_status(data);
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
    } finally {
      set_is_loading(false);
    }
  }

  async function handle_action(action: string) {
    set_action_loading(action);
    set_qr_code(null);

    try {
      const response = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (action === "connect" && data.success && data.data?.base64) {
        set_qr_code(data.data);
      }

      await check_status();
    } catch (error) {
      console.error(`Error on action ${action}:`, error);
    } finally {
      set_action_loading(null);
    }
  }

  if (is_loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (status?.config_required) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp Business
          </CardTitle>
          <CardDescription>Integração via Evolution API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-100 dark:bg-yellow-800/30 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Configuração necessária:</strong> Configure as variáveis de ambiente:
            </p>
            <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
              <li>EVOLUTION_API_URL</li>
              <li>EVOLUTION_API_KEY</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const is_connected = status?.connected;
  const instance_state = status?.instance?.state;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              WhatsApp Business
            </CardTitle>
            <CardDescription>Integração via Evolution API</CardDescription>
          </div>
          <Badge
            variant={is_connected ? "default" : "secondary"}
            className={cn(is_connected && "bg-green-600")}
          >
            {is_connected ? "Conectado" : instance_state === "connecting" ? "Conectando..." : "Desconectado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {is_connected && status?.instance && (
          <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">{status.instance.profileName || "WhatsApp Conectado"}</p>
              {status.instance.number && (
                <p className="text-sm text-muted-foreground">+{status.instance.number}</p>
              )}
            </div>
          </div>
        )}

        {qr_code?.base64 && (
          <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
            <QrCode className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-center text-muted-foreground">
              Escaneie o QR Code com seu WhatsApp
            </p>
            <div className="p-4 bg-white rounded-lg">
              <img
                src={`data:image/png;base64,${qr_code.base64}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => handle_action("connect")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar QR Code
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!is_connected && !qr_code && (
            <>
              <Button
                onClick={() => handle_action("create")}
                disabled={action_loading !== null}
                className="gap-2"
              >
                {action_loading === "create" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                Criar Instância
              </Button>
              <Button
                variant="outline"
                onClick={() => handle_action("connect")}
                disabled={action_loading !== null}
                className="gap-2"
              >
                {action_loading === "connect" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Conectar
              </Button>
            </>
          )}

          {is_connected && (
            <Button
              variant="destructive"
              onClick={() => handle_action("disconnect")}
              disabled={action_loading !== null}
              className="gap-2"
            >
              {action_loading === "disconnect" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4" />
              )}
              Desconectar
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={check_status}
            disabled={is_loading}
          >
            <RefreshCw className={cn("h-4 w-4", is_loading && "animate-spin")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
