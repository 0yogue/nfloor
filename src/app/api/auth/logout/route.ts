import { NextResponse } from "next/server";
import { logout } from "@/lib/auth/service";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookie_store = await cookies();
    const token = cookie_store.get("nfloor_session")?.value;
    
    await logout(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao fazer logout" },
      { status: 500 }
    );
  }
}
