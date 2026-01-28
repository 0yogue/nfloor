"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AccessLevel } from "@/types/rbac";
import { cn } from "@/lib/utils";
import { Clock, User, Building2, UserCog, Briefcase, Phone, Mail } from "lucide-react";

interface TeamMetricsData {
  avg_attendance_score: number;
  avg_first_response_time: number;
  clients_no_response_2h: number;
  clients_no_response_24h: number;
}

interface LeadData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  notes: string | null;
}

interface LeadMetrics {
  lead_count: number;
  visit_count: number;
  callback_count: number;
  proposal_count: number;
  sold_count: number;
}

interface SubordinateData {
  id: string;
  name: string;
  type: "superintendent" | "manager" | "seller" | "area";
  metrics: LeadMetrics;
  team_metrics?: TeamMetricsData;
  avg_response_time?: number;
}

interface HierarchicalRankingProps {
  access_level: AccessLevel;
  subordinates: SubordinateData[];
  leads?: LeadData[];
  is_loading?: boolean;
}

function format_response_time(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
}

function get_type_icon(type: string) {
  switch (type) {
    case "superintendent":
      return <Building2 className="h-4 w-4" />;
    case "manager":
      return <UserCog className="h-4 w-4" />;
    case "seller":
      return <User className="h-4 w-4" />;
    case "area":
      return <Briefcase className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
}

function get_type_label(type: string): string {
  const labels: Record<string, string> = {
    superintendent: "Superintendente",
    manager: "Gerente",
    seller: "Vendedor",
    area: "Área",
  };
  return labels[type] || type;
}

function get_status_color(status: string): string {
  const colors: Record<string, string> = {
    LEAD: "bg-blue-100 text-blue-700",
    VISIT: "bg-purple-100 text-purple-700",
    CALLBACK: "bg-amber-100 text-amber-700",
    PROPOSAL: "bg-orange-100 text-orange-700",
    SOLD: "bg-green-100 text-green-700",
    LOST: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

function get_status_label(status: string): string {
  const labels: Record<string, string> = {
    LEAD: "Lead",
    VISIT: "Visita",
    CALLBACK: "Retorno",
    PROPOSAL: "Proposta",
    SOLD: "Vendido",
    LOST: "Perdido",
  };
  return labels[status] || status;
}

function get_title_by_access_level(access_level: AccessLevel): { title: string; description: string } {
  switch (access_level) {
    case AccessLevel.SUPER_ADMIN:
    case AccessLevel.DIRECTOR:
      return {
        title: "Potencial de Melhorias na Superintendência/Gerência",
        description: "Métricas consolidadas por área de responsabilidade",
      };
    case AccessLevel.SUPERINTENDENT:
      return {
        title: "Potencial de Melhorias nas Gerências",
        description: "Métricas consolidadas por gerente",
      };
    case AccessLevel.MANAGER:
      return {
        title: "Potencial de Melhorias dos Vendedores",
        description: "Métricas individuais de cada vendedor",
      };
    case AccessLevel.SELLER:
      return {
        title: "Meus Leads",
        description: "Informações dos seus leads e deals",
      };
    default:
      return {
        title: "Ranking",
        description: "Métricas do funil",
      };
  }
}

function ImprovementRankingTable({ subordinates }: { subordinates: SubordinateData[] }) {
  if (subordinates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="text-center">Tipo</TableHead>
          <TableHead className="text-center">Nota Média Atendimento</TableHead>
          <TableHead className="text-center">Tempo médio 1ª resposta</TableHead>
          <TableHead className="text-center">Sem resposta +2h</TableHead>
          <TableHead className="text-center">Sem resposta +24h</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subordinates.map((sub) => (
          <TableRow key={sub.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {get_type_icon(sub.type)}
                {sub.name}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline" className="text-xs">
                {get_type_label(sub.type)}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              {sub.team_metrics ? sub.team_metrics.avg_attendance_score.toFixed(1) : "-"}
            </TableCell>
            <TableCell className="text-center">
              {sub.team_metrics ? format_response_time(sub.team_metrics.avg_first_response_time) : "-"}
            </TableCell>
            <TableCell className="text-center">
              {sub.team_metrics ? sub.team_metrics.clients_no_response_2h : "-"}
            </TableCell>
            <TableCell className="text-center">
              {sub.team_metrics ? sub.team_metrics.clients_no_response_24h : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LeadsTable({ leads }: { leads: LeadData[] }) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum lead encontrado
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead>Notas</TableHead>
          <TableHead className="text-center">Criado em</TableHead>
          <TableHead className="text-center">Atualizado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium">{lead.name}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {lead.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {lead.email}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge className={cn("text-xs", get_status_color(lead.status))}>
                {get_status_label(lead.status)}
              </Badge>
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
              {lead.notes || "-"}
            </TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">
              {new Date(lead.created_at).toLocaleDateString("pt-BR")}
            </TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">
              {new Date(lead.updated_at).toLocaleDateString("pt-BR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function HierarchicalRanking({
  access_level,
  subordinates,
  leads = [],
  is_loading,
}: HierarchicalRankingProps) {
  const { title, description } = get_title_by_access_level(access_level);
  const is_seller = access_level === AccessLevel.SELLER;

  if (is_loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {is_seller ? (
          <LeadsTable leads={leads} />
        ) : (
          <ImprovementRankingTable subordinates={subordinates} />
        )}
      </CardContent>
    </Card>
  );
}
