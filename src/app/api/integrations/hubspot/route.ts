import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { 
  save_hubspot_integration, 
  get_hubspot_integration,
  get_sync_logs 
} from "@/lib/hubspot";
import { AccessLevel } from "@/types/rbac";

function is_manager_or_higher(level: AccessLevel): boolean {
  return [
    AccessLevel.SUPER_ADMIN,
    AccessLevel.DIRECTOR,
    AccessLevel.SUPERINTENDENT,
    AccessLevel.MANAGER,
  ].includes(level);
}

export async function GET() {
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

    const integration = await get_hubspot_integration(user.company_id);
    const sync_logs = await get_sync_logs(user.company_id, 5);

    return NextResponse.json({
      success: true,
      data: {
        integration,
        sync_logs,
      },
    });
  } catch (error) {
    console.error("HubSpot integration GET error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar integração" },
      { status: 500 }
    );
  }
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
    const { api_key, name } = body;

    if (!api_key) {
      return NextResponse.json(
        { success: false, error: "API key é obrigatória" },
        { status: 400 }
      );
    }

    await save_hubspot_integration(user.company_id, api_key, name || "HubSpot");

    return NextResponse.json({
      success: true,
      message: "Integração salva com sucesso",
    });
  } catch (error) {
    console.error("HubSpot integration POST error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar integração" },
      { status: 500 }
    );
  }
}
