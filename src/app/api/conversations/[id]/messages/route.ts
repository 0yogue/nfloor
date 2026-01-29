import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { get_session_user } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await get_session_user();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id: conversation_id } = await params;

    // Buscar a conversa e verificar se pertence à empresa do usuário
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversation_id },
      select: {
        id: true,
        lead_id: true,
        whatsapp_chat_id: true,
        status: true,
        last_message_at: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    // Verificar se o lead pertence à empresa do usuário
    const lead = await prisma.lead.findFirst({
      where: {
        id: conversation.lead_id,
        company_id: user.company_id!,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar mensagens da conversa
    const messages = await prisma.message.findMany({
      where: { conversation_id },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        content: true,
        sender_type: true,
        created_at: true,
        whatsapp_id: true,
      },
    });

    return NextResponse.json({
      conversation: {
        ...conversation,
        lead,
      },
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}
