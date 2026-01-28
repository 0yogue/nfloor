"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ACCESS_LEVEL_LABELS, LICENSE_LABELS } from "@/types/rbac";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const get_initials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Informações da sua conta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {get_initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">
                  {ACCESS_LEVEL_LABELS[user.access_level]}
                </Badge>
                {user.license_type && (
                  <Badge variant="outline">
                    {LICENSE_LABELS[user.license_type]}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 pt-4 border-t">
            <div>
              <span className="text-sm text-muted-foreground">Empresa</span>
              <p className="font-medium">{user.company_name || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Nível de Acesso</span>
              <p className="font-medium">{ACCESS_LEVEL_LABELS[user.access_level]}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
