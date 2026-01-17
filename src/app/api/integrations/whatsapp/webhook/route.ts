import { NextRequest, NextResponse } from "next/server";
import { EvolutionWebhookPayload } from "@/types/integrations";

export async function POST(request: NextRequest) {
  try {
    const payload: EvolutionWebhookPayload = await request.json();

    console.log("[WhatsApp Webhook]", payload.event, payload.instance);

    switch (payload.event) {
      case "MESSAGES_UPSERT": {
        const message_text =
          payload.data.message?.conversation ||
          payload.data.message?.extendedTextMessage?.text;

        if (message_text && !payload.data.key.fromMe) {
          console.log("[New Message]", {
            from: payload.data.key.remoteJid,
            name: payload.data.pushName,
            text: message_text,
            timestamp: payload.data.messageTimestamp,
          });
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
