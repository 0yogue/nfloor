import { NextRequest, NextResponse } from "next/server";
import { EvolutionWebhookPayload } from "@/types/integrations";
import { process_incoming_message } from "@/lib/integrations/whatsapp-sync";

export async function POST(request: NextRequest) {
  try {
    const payload: EvolutionWebhookPayload = await request.json();

    const event_name = payload.event?.toUpperCase().replace(".", "_");
    console.log("[WhatsApp Webhook]", payload.event, "->", event_name, payload.instance);
    console.log("[WhatsApp Webhook] Full payload:", JSON.stringify(payload, null, 2));

    switch (event_name) {
      case "MESSAGES_UPSERT": {
        // Evolution API v2 pode enviar mensagem em diferentes formatos
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = payload.data as any;
        const msg = data?.message || data;
        const message_text =
          msg?.conversation ||
          msg?.extendedTextMessage?.text ||
          msg?.message?.conversation ||
          msg?.message?.extendedTextMessage?.text ||
          data?.body; // Alguns formatos usam body direto

        console.log("[Webhook] Extracted message:", message_text);

        if (message_text) {
          const remote_jid = payload.data.key.remoteJid;
          
          if (!remote_jid.endsWith("@s.whatsapp.net")) {
            console.log("[Webhook] Ignorando mensagem de grupo:", remote_jid);
            break;
          }

          const result = await process_incoming_message(
            payload.instance,
            remote_jid,
            payload.data.key.id,
            message_text,
            payload.data.pushName || null,
            (payload.data.messageTimestamp || Date.now() / 1000) * 1000,
            payload.data.key.fromMe
          );

          if (!result.success) {
            console.error("[Webhook] Erro ao processar mensagem:", result.error);
          } else {
            console.log("[Webhook] Mensagem processada:", {
              from: remote_jid,
              fromMe: payload.data.key.fromMe,
              text: message_text.substring(0, 50) + (message_text.length > 50 ? "..." : ""),
            });
          }
        }
        break;
      }

      case "CONNECTION_UPDATE": {
        console.log("[Connection Update]", payload.instance, payload.data);
        break;
      }

      case "QRCODE_UPDATED": {
        console.log("[QR Code Updated]", payload.instance);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "WhatsApp webhook endpoint",
  });
}
