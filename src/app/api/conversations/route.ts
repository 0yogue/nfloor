import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { get_session_user } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await get_session_user();
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const search_params = request.nextUrl.searchParams;
    const search = search_params.get("search") || "";
    const status = search_params.get("status") || "";
    const page = parseInt(search_params.get("page") || "1");
    const limit = parseInt(search_params.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause - Conversation doesn't have company_id directly
    // We need to filter by seller's company
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { whatsapp_chat_id: { contains: search, mode: "insensitive" } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: [
          { last_message_at: "desc" },
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Fetch leads for each conversation
    const lead_ids = [...new Set(conversations.map(c => c.lead_id))];
    
    if (!user.company_id) {
      return NextResponse.json({ conversations: [], total: 0, page, limit, total_pages: 0 });
    }

    const leads = await prisma.lead.findMany({
      where: { 
        id: { in: lead_ids },
        company_id: user.company_id,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    const leads_map = new Map(leads.map(l => [l.id, l]));

    // Combine conversations with leads
    const conversations_with_leads = conversations
      .filter(c => leads_map.has(c.lead_id)) // Only include conversations from user's company
      .map(c => ({
        ...c,
        lead: leads_map.get(c.lead_id) || null,
      }));

    return NextResponse.json({
      conversations: conversations_with_leads,
      total: conversations_with_leads.length,
      page,
      limit,
      total_pages: Math.ceil(conversations_with_leads.length / limit),
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Erro ao buscar conversas" },
      { status: 500 }
    );
  }
}
