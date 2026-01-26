import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { HubSpotClient } from "@/lib/hubspot";
import { AccessLevel } from "@/types/rbac";
import prisma from "@/lib/prisma/client";

function is_manager_or_higher(level: AccessLevel): boolean {
  return [
    AccessLevel.SUPER_ADMIN,
    AccessLevel.DIRECTOR,
    AccessLevel.SUPERINTENDENT,
    AccessLevel.MANAGER,
  ].includes(level);
}

export async function POST(request: NextRequest) {
  try {
    const user = await get_session_user();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!is_manager_or_higher(user.access_level as AccessLevel)) {
      return NextResponse.json(
        { success: false, error: "Sem permissão" },
        { status: 403 }
      );
    }

    if (!user.company_id) {
      return NextResponse.json(
        { success: false, error: "Usuário sem empresa" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { direction, seller_id, area_id } = body;

    if (!direction || !["import", "export", "bidirectional"].includes(direction)) {
      return NextResponse.json(
        { success: false, error: "Direção inválida. Use: import, export ou bidirectional" },
        { status: 400 }
      );
    }

    const client = await HubSpotClient.for_company(user.company_id);
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: "Integração HubSpot não configurada ou inativa" },
        { status: 400 }
      );
    }

    const results: {
      import?: Awaited<ReturnType<typeof client.import_contacts_to_leads>>;
      export?: Awaited<ReturnType<typeof client.export_leads_to_hubspot>>;
    } = {};

    if (direction === "import" || direction === "bidirectional") {
      const target_seller_id = seller_id || user.id;
      let target_area_id = area_id;

      if (!target_area_id) {
        const default_area = await prisma.area.findFirst({
          where: { company_id: user.company_id, is_active: true },
        });
        target_area_id = default_area?.id;
      }

      if (!target_area_id) {
        return NextResponse.json(
          { success: false, error: "Área não encontrada para importação" },
          { status: 400 }
        );
      }

      results.import = await client.import_contacts_to_leads(
        target_seller_id,
        target_area_id
      );
    }

    if (direction === "export" || direction === "bidirectional") {
      results.export = await client.export_leads_to_hubspot();
    }

    const overall_success = 
      (results.import?.success ?? true) && (results.export?.success ?? true);

    return NextResponse.json({
      success: overall_success,
      data: results,
      message: overall_success 
        ? "Sincronização concluída com sucesso" 
        : "Sincronização concluída com erros",
    });
  } catch (error) {
    console.error("HubSpot sync error:", error);
    return NextResponse.json(
      { success: false, error: "Erro durante a sincronização" },
      { status: 500 }
    );
  }
}
