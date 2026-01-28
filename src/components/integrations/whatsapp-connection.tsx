"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  Smartphone, 
  RefreshCw, 
  PowerOff, 
  QrCode, 
  Download, 
  Webhook,
  Clock,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppStatus {
  success: boolean;
  connected: boolean;
  instance?: {
    instanceName: string;
    state: "open" | "close" | "connecting";
    profileName?: string;
    number?: string;
    createdAt?: string;
  };
  config_required?: boolean;
  needs_instance?: boolean;
}

interface QRCodeData {
  base64?: string;
  code?: string;
}

interface SyncResult {
  chats_synced: number;
  messages_synced: number;
  leads_created: number;
}

// QR Code expira em ~60 segundos, atualizar a cada 45s
const QR_REFRESH_INTERVAL = 45000;

export function WhatsAppConnection() {
  const [status, set_status] = useState<WhatsAppStatus | null>(null);
  const [qr_code, set_qr_code] = useState<QRCodeData | null>(null);
  const [is_loading, set_is_loading] = useState(true);
  const [is_initializing, set_is_initializing] = useState(false);
  const [action_loading, set_action_loading] = useState<string | null>(null);
  const [sync_result, set_sync_result] = useState<SyncResult | null>(null);
  const [action_message, set_action_message] = useState<string | null>(null);
  const [qr_countdown, set_qr_countdown] = useState(45);
  
  const qr_refresh_timer = useRef<NodeJS.Timeout | null>(null);
  const countdown_timer = useRef<NodeJS.Timeout | null>(null);
  const status_poll_timer = useRef<NodeJS.Timeout | null>(null);

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      if (qr_refresh_timer.current) clearInterval(qr_refresh_timer.current);
      if (countdown_timer.current) clearInterval(countdown_timer.current);
      if (status_poll_timer.current) clearInterval(status_poll_timer.current);
    };
  }, []);

  // Inicialização automática
  useEffect(() => {
    initialize();
  }, []);

  // Quando tem QR code, iniciar auto-refresh e countdown
  useEffect(() => {
    if (qr_code?.base64) {
      // Reset countdown
      set_qr_countdown(45);
      
      // Countdown timer
      countdown_timer.current = setInterval(() => {
        set_qr_countdown(prev => {
          if (prev <= 1) return 45;
          return prev - 1;
        });
      }, 1000);

      // Auto-refresh QR code
      qr_refresh_timer.current = setInterval(() => {
        refresh_qr_code();
      }, QR_REFRESH_INTERVAL);

      // Poll status para detectar conexão
      status_poll_timer.current = setInterval(() => {
        check_status_silent();
      }, 3000);

      return () => {
        if (countdown_timer.current) clearInterval(countdown_timer.current);
        if (qr_refresh_timer.current) clearInterval(qr_refresh_timer.current);
        if (status_poll_timer.current) clearInterval(status_poll_timer.current);
      };
    }
  }, [qr_code?.base64]);

  async function check_status_silent() {
    try {
      const response = await fetch("/api/integrations/whatsapp");
      const data = await response.json();
      set_status(data);
      
      // Se conectou, limpar QR code e timers
      if (data.connected) {
        set_qr_code(null);
        if (qr_refresh_timer.current) clearInterval(qr_refresh_timer.current);
        if (countdown_timer.current) clearInterval(countdown_timer.current);
        if (status_poll_timer.current) clearInterval(status_poll_timer.current);
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
  }

  async function check_status() {
    set_is_loading(true);
    try {
      const response = await fetch("/api/integrations/whatsapp");
      const data = await response.json();
      set_status(data);
      return data;
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      return null;
    } finally {
      set_is_loading(false);
    }
  }

  // Inicialização automática: cria instância se necessário e mostra QR code
  async function initialize() {
    set_is_loading(true);
    set_is_initializing(true);
    
    try {
      // 1. Verificar status atual
      const response = await fetch("/api/integrations/whatsapp");
      const data = await response.json();
      set_status(data);

      // Se já está conectado, não precisa fazer nada
      if (data.connected) {
        set_is_loading(false);
        set_is_initializing(false);
        return;
      }

      // Se precisa configuração, parar aqui
      if (data.config_required) {
        set_is_loading(false);
        set_is_initializing(false);
        return;
      }

      // 2. Se não tem instância, criar automaticamente
      if (data.needs_instance || !data.instance) {
        console.log("[WhatsApp] Criando instância automaticamente...");
        const create_response = await fetch("/api/integrations/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create" }),
        });
        const create_data = await create_response.json();
        console.log("[WhatsApp] Instância criada:", create_data);
      }

      // 3. Gerar QR code automaticamente
      console.log("[WhatsApp] Gerando QR Code...");
      await generate_qr_code();

    } catch (error) {
      console.error("Error initializing WhatsApp:", error);
      set_action_message("Erro ao inicializar. Tente novamente.");
    } finally {
      set_is_loading(false);
      set_is_initializing(false);
    }
  }

  async function generate_qr_code() {
    try {
      const response = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });

      const data = await response.json();
      
      const qr_base64 = 
        data.data?.base64 || 
        data.data?.qrcode?.base64 ||
        data.data?.qrcode ||
        data.base64;
      
      if (qr_base64) {
        set_qr_code({ base64: qr_base64 });
      }
      
      // Atualizar status
      await check_status_silent();
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }

  async function refresh_qr_code() {
    console.log("[WhatsApp] Auto-refreshing QR Code...");
    await generate_qr_code();
    set_qr_countdown(45);
  }

  async function handle_action(action: string) {
    set_action_loading(action);
    set_sync_result(null);
    set_action_message(null);

    try {
      const response = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      console.log(`[WhatsApp ${action}] Response:`, data);

      if (action === "sync" && data.success && data.data) {
        set_sync_result(data.data);
        set_action_message("Sincronização concluída com sucesso!");
      }

      if (action === "set_webhook") {
        set_action_message(data.success ? "Webhook configurado com sucesso!" : data.error || "Erro ao configurar webhook");
      }

      if (action === "disconnect") {
        set_qr_code(null);
        set_action_message(data.success ? "Desconectado com sucesso" : data.error || "Erro ao desconectar");
      }

      await check_status();
    } catch (error) {
      console.error(`Error on action ${action}:`, error);
      set_action_message("Erro ao executar ação");
    } finally {
      set_action_loading(null);
    }
  }

  function format_date(date_string?: string) {
    if (!date_string) return null;
    try {
      return new Date(date_string).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }

  // Loading inicial
  if (is_loading && !status) {
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

  // Configuração necessária
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
            {is_connected ? "Conectado" : is_initializing ? "Inicializando..." : "Aguardando conexão"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* ESTADO: Conectado - Mostrar informações */}
        {is_connected && status?.instance && (
          <>
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                <Smartphone className="h-7 w-7 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-lg">{status.instance.profileName || "WhatsApp Conectado"}</p>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                {status.instance.number && (
                  <p className="text-sm text-muted-foreground">+{status.instance.number}</p>
                )}
                {status.instance.createdAt && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Conectado em {format_date(status.instance.createdAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Botões quando conectado */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handle_action("sync")}
                disabled={action_loading !== null}
                className="gap-2"
              >
                {action_loading === "sync" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Sincronizar Conversas
              </Button>
              <Button
                variant="outline"
                onClick={() => handle_action("set_webhook")}
                disabled={action_loading !== null}
                className="gap-2"
              >
                {action_loading === "set_webhook" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Webhook className="h-4 w-4" />
                )}
                Configurar Webhook
              </Button>
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
            </div>
          </>
        )}

        {/* ESTADO: Não conectado - Mostrar QR Code */}
        {!is_connected && (
          <>
            {is_initializing ? (
              <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-center text-muted-foreground">
                  Preparando conexão com WhatsApp...
                </p>
              </div>
            ) : qr_code?.base64 ? (
              <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Escaneie com seu WhatsApp</span>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Abra o WhatsApp no celular → Menu → Dispositivos conectados → Conectar dispositivo
                </p>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <img
                    src={qr_code.base64.startsWith('data:') ? qr_code.base64 : `data:image/png;base64,${qr_code.base64}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Atualização automática em {qr_countdown}s
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refresh_qr_code}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar agora
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                <QrCode className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-center text-muted-foreground">
                  Clique abaixo para gerar o QR Code de conexão
                </p>
                <Button onClick={initialize} className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Conectar WhatsApp
                </Button>
              </div>
            )}
          </>
        )}

        {/* Resultado da sincronização */}
        {sync_result && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Sincronização concluída!
            </p>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>📱 {sync_result.chats_synced} conversas sincronizadas</li>
              <li>💬 {sync_result.messages_synced} mensagens importadas</li>
              <li>👤 {sync_result.leads_created} leads criados</li>
            </ul>
          </div>
        )}

        {/* Mensagem de ação */}
        {action_message && !sync_result && (
          <div className={cn(
            "p-4 rounded-lg text-sm",
            action_message.includes("sucesso") || action_message.includes("concluída")
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
          )}>
            {action_message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
