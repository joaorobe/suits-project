import { NextResponse } from "next/server";
import { getDashboardMetrics } from "../../../lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const data = await getDashboardMetrics();
    return NextResponse.json(data, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ message: "Erro interno ao buscar métricas." }, { status: 500 });
  }
}
