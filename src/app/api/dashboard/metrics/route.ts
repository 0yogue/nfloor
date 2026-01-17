import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { get_data_source, resolve_dashboard, DateFilter } from "@/lib/dashboard";

export async function GET(request: NextRequest) {
  try {
    const user = await get_session_user();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }
    
    const search_params = request.nextUrl.searchParams;
    const filter_type = search_params.get("filter") || "today";
    const start_date = search_params.get("start");
    const end_date = search_params.get("end");
    
    const filter: DateFilter = {
      type: filter_type as "today" | "7days" | "30days" | "custom",
      start: start_date ? new Date(start_date) : undefined,
      end: end_date ? new Date(end_date) : undefined,
    };
    
    const data_source = get_data_source();
    const dashboard_data = await resolve_dashboard(user, filter, data_source);
    
    return NextResponse.json({
      success: true,
      data: {
        ...dashboard_data,
        period: {
          ...dashboard_data.period,
          start: dashboard_data.period.start.toISOString(),
          end: dashboard_data.period.end.toISOString(),
        },
      },
      user: {
        name: user.name,
        access_level: user.access_level,
        company_name: user.company_name,
      },
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar métricas" },
      { status: 500 }
    );
  }
}
