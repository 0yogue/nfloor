"use client";

import { useAuth } from "@/contexts/auth-context";
import { WhatsAppConnection, EmailIntegration } from "@/components/integrations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Mail, Settings } from "lucide-react";

export default function IntegrationsPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">
          Configure as integrações de WhatsApp e Email para receber leads automaticamente
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppConnection />

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Como funciona
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Conecte seu WhatsApp Business usando o QR Code</li>
              <li>Mensagens recebidas serão automaticamente vinculadas aos leads</li>
              <li>Envie mensagens diretamente pela plataforma</li>
              <li>Acompanhe o histórico de conversas em tempo real</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailIntegration />

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Como funciona
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Configure os portais para filtrar emails de leads</li>
              <li>Leads são importados automaticamente ao receber emails</li>
              <li>Dados do cliente e imóvel são extraídos automaticamente</li>
              <li>Adicione filtros personalizados para outras fontes</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
