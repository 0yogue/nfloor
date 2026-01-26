"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AccessLevel } from "@/types/rbac";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { HubSpotConfig } from "@/components/settings/hubspot-config";
import { GoogleConfig } from "@/components/settings/google-config";
import { EvolutionApiConfig } from "@/components/settings/evolution-api-config";

export default function SettingsIntegrationsPage() {
  const { user } = useAuth();
  const [active_tab, set_active_tab] = useState("hubspot");

  if (!user) {
    return null;
  }

  const can_configure = user.access_level !== AccessLevel.SELLER;

  if (!can_configure) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações de Integrações</h1>
          <p className="text-muted-foreground">
            Configure APIs externas para sua empresa
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página. 
            Apenas usuários com nível de acesso superior a Vendedor podem configurar integrações.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações de Integrações</h1>
          <p className="text-muted-foreground">
            Configure APIs externas para conectar HubSpot, Google e WhatsApp
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          Configurações da Empresa
        </Badge>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          As credenciais são armazenadas de forma segura e criptografada. 
          Apenas administradores podem visualizar e modificar estas configurações.
        </AlertDescription>
      </Alert>

      <Tabs value={active_tab} onValueChange={set_active_tab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hubspot" className="gap-2">
            <HubSpotIcon className="h-4 w-4" />
            HubSpot
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-2">
            <GoogleIcon className="h-4 w-4" />
            Google
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hubspot">
          <HubSpotConfig />
        </TabsContent>

        <TabsContent value="google">
          <GoogleConfig />
        </TabsContent>

        <TabsContent value="whatsapp">
          <EvolutionApiConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HubSpotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.164 7.93V5.084a2.198 2.198 0 0 0 1.267-1.984V3.06A2.105 2.105 0 0 0 17.37.998h-.04a2.105 2.105 0 0 0-2.061 2.061v.04c0 .873.509 1.627 1.245 1.982v2.832a5.124 5.124 0 0 0-2.576 1.24l-6.78-5.276a2.593 2.593 0 0 0 .065-.559 2.593 2.593 0 1 0-2.593 2.593c.473 0 .916-.127 1.298-.348l6.686 5.205a5.127 5.127 0 0 0-.39 1.963c0 .706.143 1.379.401 1.991l-2.143 1.666a2.073 2.073 0 0 0-1.262-.428 2.093 2.093 0 1 0 2.093 2.093c0-.388-.107-.75-.29-1.062l2.128-1.654a5.132 5.132 0 0 0 3.088 1.031 5.132 5.132 0 0 0 5.132-5.132 5.132 5.132 0 0 0-3.908-4.98zM17.33 16.2a2.48 2.48 0 1 1 0-4.96 2.48 2.48 0 0 1 0 4.96z"/>
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
