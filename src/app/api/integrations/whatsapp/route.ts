import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { create_evolution_client } from "@/lib/integrations/evolution-api";

export async function GET(request: NextRequest) {
  try {
    const user = await get_session_user();
    if (!user) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const client = create_evolution_client();
    if (!client) {
      return NextResponse.json({
        success: false,
        error: "Evolution API não configurada",
        config_required: true,
      });
    }

    const instance_name = `nfloor_${user.company_id || user.id}`;
    const result = await client.get_instance_info(instance_name);

    return NextResponse.json({
      success: true,
      instance: result.data,
      connected: result.data?.state === "open",
    });
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json({ success: false, error: "Erro ao verificar conexão" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await get_session_user();
    if (!user) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const client = create_evolution_client();
    if (!client) {
      return NextResponse.json({
        success: false,
        error: "Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY.",
      });
    }

    const instance_name = `nfloor_${user.company_id || user.id}`;

    switch (action) {
      case "create": {
        const result = await client.create_instance(instance_name);
        return NextResponse.json(result);
      }

      case "connect": {
        const result = await client.get_qr_code(instance_name);
        return NextResponse.json(result);
      }

      case "disconnect": {
        const result = await client.logout_instance(instance_name);
        return NextResponse.json(result);
      }

      case "delete": {
        const result = await client.delete_instance(instance_name);
        return NextResponse.json(result);
      }

      case "send_message": {
        const { phone, message } = body;
        if (!phone || !message) {
          return NextResponse.json({ success: false, error: "Phone e message são obrigatórios" }, { status: 400 });
        }
        const result = await client.send_text_message(instance_name, phone, message);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: "Ação inválida" }, { status: 400 });
    }
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json({ success: false, error: "Erro na operação" }, { status: 500 });
  }
}
