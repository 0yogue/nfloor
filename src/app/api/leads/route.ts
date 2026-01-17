import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { AccessLevel } from "@/types/rbac";

export async function GET(request: NextRequest) {
  try {
    const user = await get_session_user();

    if (!user) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    let where_clause: Record<string, unknown> = {};

    switch (user.access_level) {
      case AccessLevel.SUPER_ADMIN:
        break;
      case AccessLevel.DIRECTOR:
      case AccessLevel.SUPERINTENDENT:
      case AccessLevel.MANAGER:
        if (user.company_id) {
          where_clause = { company_id: user.company_id };
        }
        break;
      case AccessLevel.SELLER:
        where_clause = { seller_id: user.id };
        break;
      default:
        where_clause = { id: "none" };
    }

    const leads = await prisma.lead.findMany({
      where: where_clause,
      orderBy: { created_at: "desc" },
      take: 100,
    });

    const formatted_leads = leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      notes: lead.notes,
      seller_id: lead.seller_id,
      area_id: lead.area_id,
      company_id: lead.company_id,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: formatted_leads,
      count: formatted_leads.length,
    });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json({ success: false, error: "Erro ao carregar leads" }, { status: 500 });
  }
}
