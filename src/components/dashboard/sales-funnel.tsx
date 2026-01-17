"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FunnelStage {
  label: string;
  count: number;
  color: string;
  bg_color: string;
}

interface SalesFunnelProps {
  metrics: {
    new_count: number;
    qualified_count: number;
    callback_count: number;
    proposal_count: number;
    sold_count: number;
  };
  is_loading?: boolean;
}

export function SalesFunnel({ metrics, is_loading }: SalesFunnelProps) {
  const stages: FunnelStage[] = [
    { label: "Novos", count: metrics.new_count, color: "text-blue-600", bg_color: "bg-blue-500" },
    { label: "Qualificados", count: metrics.qualified_count, color: "text-cyan-600", bg_color: "bg-cyan-500" },
    { label: "Retorno", count: metrics.callback_count, color: "text-amber-600", bg_color: "bg-amber-500" },
    { label: "Proposta", count: metrics.proposal_count, color: "text-orange-600", bg_color: "bg-orange-500" },
    { label: "Vendidos", count: metrics.sold_count, color: "text-green-600", bg_color: "bg-green-500" },
  ];

  const max_count = Math.max(...stages.map(s => s.count), 1);
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  const conversion_rates = stages.map((stage, index) => {
    if (index === 0) return 100;
    const previous = stages[index - 1].count;
    if (previous === 0) return 0;
    return Math.round((stage.count / previous) * 100);
  });

  if (is_loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando funil...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Funil de Vendas</CardTitle>
        <CardDescription>
          {total} leads no período • Taxa de conversão geral: {metrics.new_count > 0 ? Math.round((metrics.sold_count / metrics.new_count) * 100) : 0}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const width_percent = max_count > 0 ? (stage.count / max_count) * 100 : 0;
            const min_width = 20;
            const display_width = Math.max(width_percent, min_width);
            
            return (
              <div key={stage.label} className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-right shrink-0">
                    {stage.label}
                  </div>
                  
                  <div className="flex-1 relative h-10">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-r-lg transition-all duration-500 flex items-center justify-end pr-3",
                        stage.bg_color
                      )}
                      style={{ 
                        width: `${display_width}%`,
                        clipPath: index < stages.length - 1 
                          ? "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)"
                          : "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
                      }}
                    >
                      <span className="text-white font-bold text-sm drop-shadow">
                        {stage.count}
                      </span>
                    </div>
                  </div>

                  <div className="w-16 text-xs text-muted-foreground text-right shrink-0">
                    {index > 0 && (
                      <span className={cn(
                        conversion_rates[index] >= 50 ? "text-green-600" :
                        conversion_rates[index] >= 25 ? "text-amber-600" : "text-red-600"
                      )}>
                        {conversion_rates[index]}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t grid grid-cols-5 gap-2 text-center">
          {stages.map((stage, index) => (
            <div key={`stat-${stage.label}`} className="space-y-1">
              <div className={cn("text-2xl font-bold", stage.color)}>
                {stage.count}
              </div>
              <div className="text-xs text-muted-foreground">
                {stage.label}
              </div>
              {index > 0 && (
                <div className={cn(
                  "text-xs",
                  conversion_rates[index] >= 50 ? "text-green-600" :
                  conversion_rates[index] >= 25 ? "text-amber-600" : "text-red-600"
                )}>
                  ↓ {conversion_rates[index]}%
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
