"use client";

import { LeadFull, TEMPERATURE_CONFIG, LEAD_SOURCE_LABELS, PropertyType, OperationType } from "@/types/leads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  MapPin,
  Home,
  BedDouble,
  Bath,
  Ruler,
  Clock,
  AlertCircle,
} from "lucide-react";

interface LeadDetailsProps {
  lead: LeadFull | null;
}

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "Apartamento",
  [PropertyType.HOUSE]: "Casa",
  [PropertyType.LAND]: "Terreno",
  [PropertyType.COMMERCIAL]: "Comercial",
  [PropertyType.PENTHOUSE]: "Cobertura",
  [PropertyType.STUDIO]: "Studio",
  [PropertyType.OTHER]: "Outro",
};

const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  [OperationType.SALE]: "Venda",
  [OperationType.RENT]: "Aluguel",
  [OperationType.BOTH]: "Venda/Aluguel",
};

function format_currency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

export function LeadDetails({ lead }: LeadDetailsProps) {
  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Selecione um lead para ver os detalhes</p>
        </div>
      </div>
    );
  }

  const temp_config = TEMPERATURE_CONFIG[lead.temperature];
  const property = lead.property_interest;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{lead.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={temp_config.color}>
                  {temp_config.label}
                </Badge>
                <span>•</span>
                <span>{LEAD_SOURCE_LABELS[lead.source]}</span>
              </CardDescription>
            </div>
            {lead.hours_without_response && lead.hours_without_response > 2 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Aguardando {Math.round(lead.hours_without_response)}h
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {lead.phone && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={`tel:${lead.phone}`}>
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </a>
              </Button>
            )}
            {lead.email && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={`mailto:${lead.email}`}>
                  <Mail className="h-4 w-4" />
                  {lead.email}
                </a>
              </Button>
            )}
            {lead.phone && (
              <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700" asChild>
                <a href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>

          {lead.last_message && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <MessageCircle className="h-3 w-3" />
                Última mensagem
                {lead.last_message_at && (
                  <span>• {format(new Date(lead.last_message_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                )}
              </div>
              <p className="text-sm">{lead.last_message}</p>
            </div>
          )}

          {lead.notes && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{lead.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {property && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5" />
                Imóvel de Interesse
              </CardTitle>
              <Badge>{OPERATION_TYPE_LABELS[property.operation_type]}</Badge>
            </div>
            <CardDescription>
              {PROPERTY_TYPE_LABELS[property.property_type]} • Cód: {property.code}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">{property.address}</p>
                <p className="text-sm text-muted-foreground">
                  {property.neighborhood}, {property.city} - {property.state}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {property.bedrooms && (
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{property.bedrooms} quartos</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{property.bathrooms} banheiros</span>
                </div>
              )}
              {property.area_sqm && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{property.area_sqm}m²</span>
                </div>
              )}
              {property.price && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-lg font-bold text-primary">
                    {format_currency(property.price)}
                    {property.operation_type === OperationType.RENT && <span className="text-sm font-normal">/mês</span>}
                  </p>
                </div>
              )}
            </div>

            {property.portal_url && (
              <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                <a href={property.portal_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Ver no Portal
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Criado em</span>
              <span>{format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Último contato</span>
              <span>
                {lead.last_contact_at
                  ? format(new Date(lead.last_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : "Sem contato"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total de mensagens</span>
              <span>{lead.message_count}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vendedor</span>
              <span>{lead.seller_name || "Não atribuído"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
