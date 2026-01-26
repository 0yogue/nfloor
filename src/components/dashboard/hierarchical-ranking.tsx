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

interface LeadMetrics {
  new_count: number;
  qualified_count: number;
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
  avg_response_time?: number;
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

interface HierarchicalRankingProps {
  access_level: AccessLevel;
  subordinates: SubordinateData[];
  leads?: LeadData[];
  is_loading?: boolean;
}

const MOCK_SUBORDINATES: SubordinateData[] = [
  {
    id: "mock_1",
    name: "Carlos Mendes (Zona Sul)",
    type: "manager",
    metrics: { new_count: 45, qualified_count: 32, visit_count: 18, callback_count: 12, proposal_count: 8, sold_count: 5 },
    avg_response_time: 12,
  },
  {
    id: "mock_2",
    name: "Ana Paula (Zona Norte)",
    type: "manager",
    metrics: { new_count: 38, qualified_count: 28, visit_count: 15, callback_count: 10, proposal_count: 6, sold_count: 4 },
    avg_response_time: 18,
  },
  {
    id: "mock_3",
    name: "Roberto Silva (Centro)",
    type: "manager",
    metrics: { new_count: 52, qualified_count: 40, visit_count: 22, callback_count: 14, proposal_count: 10, sold_count: 7 },
    avg_response_time: 8,
  },
  {
    id: "mock_4",
    name: "Fernanda Costa (Zona Oeste)",
    type: "manager",
    metrics: { new_count: 30, qualified_count: 22, visit_count: 12, callback_count: 8, proposal_count: 5, sold_count: 3 },
    avg_response_time: 25,
  },
];

const MOCK_SELLER_SUBORDINATES: SubordinateData[] = [
  {
    id: "seller_1",
    name: "João Santos",
    type: "seller",
    metrics: { new_count: 18, qualified_count: 12, visit_count: 8, callback_count: 5, proposal_count: 4, sold_count: 2 },
    avg_response_time: 10,
  },
  {
    id: "seller_2",
    name: "Maria Oliveira",
    type: "seller",
    metrics: { new_count: 22, qualified_count: 15, visit_count: 10, callback_count: 6, proposal_count: 5, sold_count: 3 },
    avg_response_time: 8,
  },
  {
    id: "seller_3",
    name: "Pedro Lima",
    type: "seller",
    metrics: { new_count: 15, qualified_count: 10, visit_count: 6, callback_count: 4, proposal_count: 3, sold_count: 2 },
    avg_response_time: 15,
  },
];

const MOCK_LEADS: LeadData[] = [
  {
    id: "lead_1",
    name: "Maria Silva",
    phone: "(11) 99999-1234",
    email: "maria.silva@email.com",
    status: "QUALIFIED",
    notes: "Interessada em apartamento 3 quartos",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lead_2",
    name: "João Santos",
    phone: "(11) 98888-5678",
    email: "joao.santos@email.com",
    status: "VISIT",
    notes: "Visita agendada para sábado",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lead_3",
    name: "Ana Costa",
    phone: "(11) 97777-9012",
    email: "ana.costa@email.com",
    status: "PROPOSAL",
    notes: "Proposta enviada - aguardando resposta",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lead_4",
    name: "Pedro Lima",
    phone: "(11) 96666-3456",
    email: "pedro.lima@email.com",
    status: "CALLBACK",
    notes: "Retornar após análise de crédito",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lead_5",
    name: "Carla Souza",
    phone: "(11) 95555-7890",
    email: "carla.souza@email.com",
    status: "NEW",
    notes: "Novo lead do portal ZAP",
    created_at: new Date(),
    updated_at: new Date(),
  },
];

function format_response_time(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining_minutes = Math.round(minutes % 60);
  if (hours < 24) {
    return remaining_minutes > 0 ? `${hours}h ${remaining_minutes}min` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function get_status_color(status: string): string {
  const colors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    QUALIFIED: "bg-cyan-100 text-cyan-700",
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
    NEW: "Novo",
    QUALIFIED: "Qualificado",
    VISIT: "Visita",
    CALLBACK: "Retorno",
    PROPOSAL: "Proposta",
    SOLD: "Vendido",
    LOST: "Perdido",
  };
  return labels[status] || status;
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

function get_title_by_access_level(access_level: AccessLevel): { title: string; description: string } {
  switch (access_level) {
    case AccessLevel.SUPER_ADMIN:
    case AccessLevel.DIRECTOR:
      return {
        title: "Visão por Superintendência/Gerência",
        description: "Métricas consolidadas por área de responsabilidade",
      };
    case AccessLevel.SUPERINTENDENT:
      return {
        title: "Visão por Gerência",
        description: "Métricas consolidadas por gerente",
      };
    case AccessLevel.MANAGER:
      return {
        title: "Visão por Vendedor",
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

function SubordinatesRankingTable({ subordinates }: { subordinates: SubordinateData[] }) {
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
          <TableHead className="text-center">Novos</TableHead>
          <TableHead className="text-center">Qualif.</TableHead>
          <TableHead className="text-center">Visitas</TableHead>
          <TableHead className="text-center">Retorno</TableHead>
          <TableHead className="text-center">Proposta</TableHead>
          <TableHead className="text-center">Vendas</TableHead>
          <TableHead className="text-center">Total</TableHead>
          <TableHead className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              <span>TPR</span>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subordinates.map((sub) => {
          const total =
            sub.metrics.new_count +
            sub.metrics.qualified_count +
            sub.metrics.visit_count +
            sub.metrics.callback_count +
            sub.metrics.proposal_count +
            sub.metrics.sold_count;

          return (
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
              <TableCell className="text-center">{sub.metrics.new_count}</TableCell>
              <TableCell className="text-center">{sub.metrics.qualified_count}</TableCell>
              <TableCell className="text-center">{sub.metrics.visit_count}</TableCell>
              <TableCell className="text-center">{sub.metrics.callback_count}</TableCell>
              <TableCell className="text-center">{sub.metrics.proposal_count}</TableCell>
              <TableCell className="text-center font-semibold text-green-600">
                {sub.metrics.sold_count}
              </TableCell>
              <TableCell className="text-center font-bold">{total}</TableCell>
              <TableCell className="text-center">
                <span className={cn(
                  "text-sm",
                  sub.avg_response_time && sub.avg_response_time > 60 ? "text-red-500" : "text-green-500"
                )}>
                  {sub.avg_response_time ? format_response_time(sub.avg_response_time) : "-"}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
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
  
  // Use mock data as fallback when no real data is available
  const display_subordinates = subordinates.length > 0 
    ? subordinates 
    : access_level === AccessLevel.MANAGER 
      ? MOCK_SELLER_SUBORDINATES 
      : MOCK_SUBORDINATES;
  
  const display_leads = leads.length > 0 ? leads : MOCK_LEADS;

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
          <LeadsTable leads={display_leads} />
        ) : (
          <SubordinatesRankingTable subordinates={display_subordinates} />
        )}
      </CardContent>
    </Card>
  );
}
