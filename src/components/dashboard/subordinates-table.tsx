"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, UserCog, Briefcase } from "lucide-react";

interface LeadMetrics {
  new_count: number;
  qualified_count: number;
  visit_count: number;
  callback_count: number;
  proposal_count: number;
  sold_count: number;
}

interface SubordinateMetrics {
  id: string;
  name: string;
  type: "superintendent" | "manager" | "seller" | "area";
  access_level?: string;
  metrics: LeadMetrics;
}

interface SubordinatesTableProps {
  subordinates: SubordinateMetrics[];
  is_loading?: boolean;
}

function get_type_icon(type: string) {
  switch (type) {
    case "superintendent":
      return <Briefcase className="h-4 w-4" />;
    case "manager":
      return <UserCog className="h-4 w-4" />;
    case "seller":
      return <Users className="h-4 w-4" />;
    case "area":
      return <Building2 className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
}

function get_type_label(type: string) {
  switch (type) {
    case "superintendent":
      return "Superintendente";
    case "manager":
      return "Gerente";
    case "seller":
      return "Vendedor";
    case "area":
      return "Área";
    default:
      return type;
  }
}

function get_type_color(type: string) {
  switch (type) {
    case "superintendent":
      return "bg-purple-500/20 text-purple-500";
    case "manager":
      return "bg-blue-500/20 text-blue-500";
    case "seller":
      return "bg-green-500/20 text-green-500";
    case "area":
      return "bg-amber-500/20 text-amber-500";
    default:
      return "bg-gray-500/20 text-gray-500";
  }
}

export function SubordinatesTable({ subordinates, is_loading }: SubordinatesTableProps) {
  if (subordinates.length === 0 && !is_loading) {
    return null;
  }

  const first_type = subordinates[0]?.type;
  const title = first_type
    ? `Métricas por ${get_type_label(first_type)}`
    : "Métricas da Equipe";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {get_type_icon(first_type || "seller")}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {is_loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : (
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
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={get_type_color(sub.type)}>
                        {get_type_label(sub.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{sub.metrics.new_count}</TableCell>
                    <TableCell className="text-center">{sub.metrics.qualified_count}</TableCell>
                    <TableCell className="text-center">{sub.metrics.visit_count}</TableCell>
                    <TableCell className="text-center">{sub.metrics.callback_count}</TableCell>
                    <TableCell className="text-center">{sub.metrics.proposal_count}</TableCell>
                    <TableCell className="text-center font-semibold text-green-500">
                      {sub.metrics.sold_count}
                    </TableCell>
                    <TableCell className="text-center font-bold">{total}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
