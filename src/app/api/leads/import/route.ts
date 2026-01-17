import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { parse_email } from "@/lib/leads/email-parser";

export async function POST(request: NextRequest) {
  try {
    const user = await get_session_user();

    if (!user) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const form_data = await request.formData();
    const file = form_data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const file_content = await file.text();
    const file_name = file.name.toLowerCase();

    let imported = 0;
    let failed = 0;

    if (file_name.endsWith(".eml")) {
      const lines = file_content.split("\n");
      let from = "";
      let subject = "";
      let body = "";
      let in_body = false;

      for (const line of lines) {
        if (line.toLowerCase().startsWith("from:")) {
          from = line.substring(5).trim();
        } else if (line.toLowerCase().startsWith("subject:")) {
          subject = line.substring(8).trim();
        } else if (line === "" && !in_body) {
          in_body = true;
        } else if (in_body) {
          body += line + "\n";
        }
      }

      const result = parse_email({
        from,
        subject,
        body,
        received_at: new Date(),
      });

      if (result.success && result.lead) {
        imported = 1;
      } else {
        failed = 1;
      }
    } else if (file_name.endsWith(".csv")) {
      const lines = file_content.split("\n").filter(l => l.trim());
      const header = lines[0]?.toLowerCase().split(",") || [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length >= 2) {
          imported++;
        } else {
          failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      failed,
      message: `${imported} lead(s) importado(s) com sucesso`,
    });
  } catch (error) {
    console.error("Import API error:", error);
    return NextResponse.json({ success: false, error: "Erro ao importar leads" }, { status: 500 });
  }
}
