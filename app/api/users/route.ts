import { NextResponse } from "next/server";
import { getCostureiras } from "../../../lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");

  if (role === "costureira") {
    const users = await getCostureiras();
    return NextResponse.json(users, { headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ message: "Role inválida." }, { status: 400 });
}
