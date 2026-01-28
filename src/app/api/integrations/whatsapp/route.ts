import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { create_evolution_client, get_instance_name } from "@/lib/integrations/evolution-api";
import { sync_whatsapp_chats } from "@/lib/integrations/whatsapp-sync";

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

    const instance_name = get_instance_name(user.company_id || undefined);
    const result = await client.get_instance_info(instance_name);

    // Evolution API pode retornar array ou objeto
    // Normalizar para encontrar a instância correta
    let instance_data = null;
    
    if (result.success && result.data) {
      if (Array.isArray(result.data)) {
        // Buscar instância pelo nome no array
        instance_data = result.data.find((i: { name?: string }) => i.name === instance_name) || result.data[0];
      } else {
        instance_data = result.data;
      }
    }

    // Verificar se a instância existe e está conectada
    // Evolution API usa "connectionStatus" ou "state"
    const instance_exists = !!instance_data;
    const connection_status = instance_data?.connectionStatus || instance_data?.state;
    const is_connected = instance_exists && connection_status === "open";

    return NextResponse.json({
      success: true,
      instance: instance_exists ? {
        instanceName: instance_data.name || instance_data.instanceName,
        state: connection_status,
        profileName: instance_data.profileName,
        profilePicUrl: instance_data.profilePicUrl,
        number: instance_data.ownerJid?.replace("@s.whatsapp.net", "") || instance_data.number,
        createdAt: instance_data.createdAt,
      } : null,
      connected: is_connected,
      needs_instance: !instance_exists,
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

    const instance_name = get_instance_name(user.company_id || undefined);

    switch (action) {
      case "create": {
        const result = await client.create_instance(instance_name);
        return NextResponse.json(result);
      }

      case "connect": {
        const result = await client.get_qr_code(instance_name);
        console.log("[WhatsApp API] QR Code response:", JSON.stringify(result, null, 2));
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

      case "sync": {
        if (!user.company_id) {
          return NextResponse.json({ success: false, error: "Usuário sem empresa associada" }, { status: 400 });
        }
        const sync_result = await sync_whatsapp_chats(client, user.company_id);
        return NextResponse.json({
          success: sync_result.success,
          data: {
            chats_synced: sync_result.chats_synced,
            messages_synced: sync_result.messages_synced,
            leads_created: sync_result.leads_created,
          },
          errors: sync_result.errors.length > 0 ? sync_result.errors : undefined,
        });
      }

      case "set_webhook": {
        const webhook_url = body.webhook_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/whatsapp/webhook`;
        const result = await client.set_webhook(instance_name, webhook_url);
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
