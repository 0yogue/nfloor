"use client";

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Phone,
  User,
  Send,
  ArrowLeft,
  MoreVertical,
  Check,
  CheckCheck
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  whatsapp_chat_id: string | null;
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

interface Message {
  id: string;
  content: string;
  sender_type: "SELLER" | "LEAD";
  created_at: string;
  whatsapp_id: string | null;
}

interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

interface MessagesResponse {
  conversation: Conversation;
  messages: Message[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500",
  WAITING_RESPONSE: "bg-yellow-500",
  CLOSED: "bg-gray-500",
  ARCHIVED: "bg-gray-400",
};

export default function ConversationsPage() {
  const [conversations, set_conversations] = useState<Conversation[]>([]);
  const [is_loading, set_is_loading] = useState(true);
  const [search, set_search] = useState("");
  const [selected_conversation, set_selected_conversation] = useState<Conversation | null>(null);
  const [messages, set_messages] = useState<Message[]>([]);
  const [messages_loading, set_messages_loading] = useState(false);
  const [new_message, set_new_message] = useState("");
  const [is_mobile_chat_open, set_is_mobile_chat_open] = useState(false);
  
  const messages_end_ref = useRef<HTMLDivElement>(null);

  async function load_conversations() {
    set_is_loading(true);
    try {
      const response = await fetch("/api/conversations");
      const data: ConversationsResponse = await response.json();
      set_conversations(data.conversations || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      set_is_loading(false);
    }
  }

  async function load_messages(conversation_id: string) {
    set_messages_loading(true);
    try {
      const response = await fetch(`/api/conversations/${conversation_id}/messages`);
      const data: MessagesResponse = await response.json();
      set_messages(data.messages || []);
      
      // Scroll to bottom
      setTimeout(() => {
        messages_end_ref.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      set_messages_loading(false);
    }
  }

  useEffect(() => {
    load_conversations();
  }, []);

  useEffect(() => {
    if (selected_conversation) {
      load_messages(selected_conversation.id);
    }
  }, [selected_conversation?.id]);

  function select_conversation(conv: Conversation) {
    set_selected_conversation(conv);
    set_is_mobile_chat_open(true);
  }

  function get_initials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function format_time(date: string) {
    const d = new Date(date);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Ontem";
    return format(d, "dd/MM/yyyy");
  }

  function format_message_time(date: string) {
    return format(new Date(date), "HH:mm");
  }

  function format_message_date(date: string) {
    const d = new Date(date);
    if (isToday(d)) return "Hoje";
    if (isYesterday(d)) return "Ontem";
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  // Group messages by date
  function group_messages_by_date(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    let current_date = "";

    for (const msg of msgs) {
      const msg_date = format(new Date(msg.created_at), "yyyy-MM-dd");
      if (msg_date !== current_date) {
        current_date = msg_date;
        groups.push({ date: msg.created_at, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }

    return groups;
  }

  const filtered_conversations = conversations.filter((conv) => {
    if (!search) return true;
    const search_lower = search.toLowerCase();
    return (
      conv.lead?.name?.toLowerCase().includes(search_lower) ||
      conv.lead?.phone?.includes(search)
    );
  });

  const message_groups = group_messages_by_date(messages);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Lista de conversas (sidebar esquerda) */}
      <div className={cn(
        "w-full md:w-96 border-r flex flex-col bg-background",
        is_mobile_chat_open && "hidden md:flex"
      )}>
        {/* Header da lista */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Conversas</h1>
            <Button onClick={load_conversations} variant="ghost" size="icon">
              <RefreshCw className={cn("h-4 w-4", is_loading && "animate-spin")} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => set_search(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <ScrollArea className="flex-1">
          {is_loading ? (
            <div className="p-2 space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered_conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
              </p>
            </div>
          ) : (
            <div className="p-1">
              {filtered_conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => select_conversation(conv)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors",
                    "hover:bg-muted/50",
                    selected_conversation?.id === conv.id && "bg-muted"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conv.lead?.name ? get_initials(conv.lead.name) : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                      STATUS_COLORS[conv.status]
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">
                        {conv.lead?.name || "Contato"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {conv.last_message_at ? format_time(conv.last_message_at) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm text-muted-foreground truncate">
                        {conv.lead?.phone || "Sem telefone"}
                      </span>
                      {conv._count.messages > 0 && conv.status === "WAITING_RESPONSE" && (
                        <Badge variant="default" className="h-5 min-w-5 text-xs">
                          {conv._count.messages > 99 ? "99+" : conv._count.messages}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Área do chat (direita) */}
      <div className={cn(
        "flex-1 flex flex-col bg-muted/30",
        !is_mobile_chat_open && "hidden md:flex"
      )}>
        {selected_conversation ? (
          <>
            {/* Header do chat */}
            <div className="flex items-center gap-3 p-4 border-b bg-background">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => set_is_mobile_chat_open(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selected_conversation.lead?.name 
                    ? get_initials(selected_conversation.lead.name) 
                    : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {selected_conversation.lead?.name || "Contato"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selected_conversation.lead?.phone || "Sem telefone"}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              {messages_loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {message_groups.map((group, group_index) => (
                    <div key={group_index}>
                      {/* Date separator */}
                      <div className="flex justify-center mb-4">
                        <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                          {format_message_date(group.date)}
                        </span>
                      </div>
                      
                      {/* Messages */}
                      <div className="space-y-1">
                        {group.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              msg.sender_type === "SELLER" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] px-3 py-2 rounded-lg relative",
                                msg.sender_type === "SELLER"
                                  ? "bg-primary text-primary-foreground rounded-br-none"
                                  : "bg-background rounded-bl-none shadow-sm"
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                              <div className={cn(
                                "flex items-center gap-1 mt-1",
                                msg.sender_type === "SELLER" ? "justify-end" : "justify-start"
                              )}>
                                <span className={cn(
                                  "text-[10px]",
                                  msg.sender_type === "SELLER" 
                                    ? "text-primary-foreground/70" 
                                    : "text-muted-foreground"
                                )}>
                                  {format_message_time(msg.created_at)}
                                </span>
                                {msg.sender_type === "SELLER" && (
                                  <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={messages_end_ref} />
                </div>
              )}
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Digite uma mensagem..."
                  value={new_message}
                  onChange={(e) => set_new_message(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      // TODO: Implementar envio de mensagem
                    }
                  }}
                />
                <Button size="icon" disabled={!new_message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">NFloor Web</h2>
            <p className="text-muted-foreground max-w-md">
              Selecione uma conversa ao lado para visualizar as mensagens.
              As mensagens são sincronizadas em tempo real via WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
