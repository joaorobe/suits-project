import { NextResponse } from "next/server";
import { addInventory, getInventory } from "../../../lib/data";
import type { InventoryItem } from "../../../lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const items = await getInventory(search);
  return NextResponse.json(items, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<InventoryItem>;
  if (!payload.title || !payload.subtitle || !payload.size || !payload.color) {
    return NextResponse.json({ message: "Dados do inventário incompletos." }, { status: 400 });
  }

  const item: InventoryItem = {
    id: payload.id ?? `INV-${Date.now()}`,
    title: payload.title,
    subtitle: payload.subtitle,
    sku: payload.sku ?? `SKU-${Date.now()}`,
    status: payload.status ?? "Disponível",
    size: payload.size,
    color: payload.color,
    location: payload.location ?? "Estoque Central",
    stock: payload.stock ?? 1,
    image: payload.image ?? "/terno1.jpg",
    action: payload.action ?? "Reservar Traje",
    priceCategory: payload.priceCategory,
    price: payload.price,
  };

  const created = await addInventory(item);
  return NextResponse.json(created, { status: 201 });
}
