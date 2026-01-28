"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Administração do Sistema</h1>
        <p className="text-muted-foreground">
          Configurações avançadas do sistema
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Área restrita</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Funcionalidades de administração em desenvolvimento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
