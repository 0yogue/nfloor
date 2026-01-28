"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Notificações</h1>
        <p className="text-muted-foreground">
          Suas notificações e alertas
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma notificação</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Você não tem notificações no momento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
