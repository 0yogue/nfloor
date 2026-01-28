"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">
          Gerenciamento de usuários do sistema
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Em desenvolvimento</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Esta funcionalidade estará disponível em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
