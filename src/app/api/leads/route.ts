import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { get_all_leads, get_leads_by_seller, get_leads_by_company } from "@/lib/leads";
import { AccessLevel } from "@/types/rbac";

export async function GET(request: NextRequest) {
  try {
    const user = await get_session_user();

    if (!user) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    let leads;

    switch (user.access_level) {
      case AccessLevel.SUPER_ADMIN:
      case AccessLevel.DIRECTOR:
      case AccessLevel.SUPERINTENDENT:
      case AccessLevel.MANAGER:
        leads = user.company_id ? get_leads_by_company(user.company_id) : get_all_leads();
        break;
      case AccessLevel.SELLER:
        leads = get_leads_by_seller(user.id);
        break;
      default:
        leads = [];
    }

    return NextResponse.json({
      success: true,
      data: leads,
      count: leads.length,
    });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json({ success: false, error: "Erro ao carregar leads" }, { status: 500 });
  }
}
