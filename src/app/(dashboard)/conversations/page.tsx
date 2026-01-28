"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Phone,
  Clock,
  User,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  whatsapp_chat_id: string | null;
  channel: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  lead: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  _count: {
    messages: number;
  };
}

interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  WAITING_RESPONSE: "Aguardando",
  CLOSED: "Fechada",
  ARCHIVED: "Arquivada",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500",
  WAITING_RESPONSE: "bg-yellow-500",
  CLOSED: "bg-gray-500",
  ARCHIVED: "bg-gray-400",
};

export default function ConversationsPage() {
  const [conversations, set_conversations] = useState<Conversation[]>([]);
  const [total, set_total] = useState(0);
  const [is_loading, set_is_loading] = useState(true);
  const [search, set_search] = useState("");
  const [selected_id, set_selected_id] = useState<string | null>(null);

  async function load_conversations() {
    set_is_loading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      
      const response = await fetch(`/api/conversations?${params}`);
      const data: ConversationsResponse = await response.json();
      
      set_conversations(data.conversations || []);
      set_total(data.total || 0);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      set_is_loading(false);
    }
  }

  useEffect(() => {
    load_conversations();
  }, []);

  function get_initials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function format_time(date: string | null) {
    if (!date) return "—";
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ptBR 
    });
  }

  const filtered_conversations = conversations.filter((conv) => {
    if (!search) return true;
    const search_lower = search.toLowerCase();
    return (
      conv.lead?.name?.toLowerCase().includes(search_lower) ||
      conv.lead?.phone?.includes(search) ||
      conv.whatsapp_chat_id?.includes(search)
    );
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversas</h1>
          <p className="text-muted-foreground">
            {total} conversa{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={load_conversations} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone..."
          value={search}
          onChange={(e) => set_search(e.target.value)}
          className="pl-10"
        />
      </div>

      {is_loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered_conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma conversa encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search 
                ? "Tente buscar por outro termo" 
                : "Conecte o WhatsApp e sincronize as conversas"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered_conversations.map((conv) => (
            <Card 
              key={conv.id} 
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selected_id === conv.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => set_selected_id(conv.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {conv.lead?.name ? get_initials(conv.lead.name) : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {conv.lead?.name || "Contato desconhecido"}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`${STATUS_COLORS[conv.status]} text-white text-xs`}
                      >
                        {STATUS_LABELS[conv.status] || conv.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {conv.lead?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {conv.lead.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {conv._count.messages} mensagens
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format_time(conv.last_message_at || conv.created_at)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
