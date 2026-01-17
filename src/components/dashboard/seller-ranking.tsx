"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SellerRanking } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { Circle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SellerRankingTableProps {
  ranking: SellerRanking[];
  is_loading?: boolean;
}

function format_response_time(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  return `${Math.floor(seconds / 3600)}h`;
}

function get_score_color(score: number): string {
  if (score >= 8) return "text-green-500";
  if (score >= 6) return "text-amber-500";
  return "text-red-500";
}

function get_response_time_color(seconds: number): string {
  if (seconds <= 300) return "text-green-500";
  if (seconds <= 600) return "text-amber-500";
  return "text-red-500";
}

export function SellerRankingTable({ ranking, is_loading }: SellerRankingTableProps) {
  if (is_loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Vendedores</CardTitle>
          <CardDescription>Performance individual do time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return null;
  }

  const sorted_ranking = [...ranking].sort((a, b) => {
    const score_a = a.playbook_score * 0.4 + (1 - a.avg_response_time / 3600) * 0.3 + a.conversion_rate * 0.3;
    const score_b = b.playbook_score * 0.4 + (1 - b.avg_response_time / 3600) * 0.3 + b.conversion_rate * 0.3;
    return score_b - score_a;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Vendedores</CardTitle>
        <CardDescription>Performance individual do time ordenada por score composto</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Conversas</TableHead>
              <TableHead className="text-right">Tempo Resp.</TableHead>
              <TableHead className="text-right">Playbook</TableHead>
              <TableHead className="text-right">Sem Resp.</TableHead>
              <TableHead className="text-right">Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted_ranking.map((seller, index) => (
              <TableRow key={seller.id}>
                <TableCell className="font-medium">
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                    index === 0 && "bg-yellow-500/20 text-yellow-600",
                    index === 1 && "bg-gray-300/20 text-gray-600",
                    index === 2 && "bg-amber-600/20 text-amber-700",
                    index > 2 && "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{seller.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Circle 
                      className={cn(
                        "h-2 w-2 fill-current",
                        seller.is_online ? "text-green-500" : "text-gray-400"
                      )} 
                    />
                    <span className="text-xs text-muted-foreground">
                      {seller.is_online ? "Online" : "Offline"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {seller.new_conversations}
                </TableCell>
                <TableCell className={cn("text-right", get_response_time_color(seller.avg_response_time))}>
                  {format_response_time(seller.avg_response_time)}
                </TableCell>
                <TableCell className={cn("text-right font-medium", get_score_color(seller.playbook_score))}>
                  {seller.playbook_score.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  {seller.leads_without_response > 0 ? (
                    <Badge variant="destructive" className="text-xs">
                      {seller.leads_without_response}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                      0
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className={cn(
                      "font-medium",
                      seller.conversion_rate >= 20 ? "text-green-500" : 
                      seller.conversion_rate >= 10 ? "text-amber-500" : "text-red-500"
                    )}>
                      {seller.conversion_rate.toFixed(0)}%
                    </span>
                    {seller.conversion_rate >= 20 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : seller.conversion_rate >= 10 ? (
                      <Minus className="h-3 w-3 text-amber-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
