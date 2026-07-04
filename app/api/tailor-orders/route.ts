import { NextResponse } from "next/server";
import { getTailorOrders, getTailorOrderById, createTailorOrder, updateTailorOrder, deleteTailorOrder, updateInventory } from "../../../lib/data";
import type { TailorOrder } from "../../../lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assignedTo = url.searchParams.get("assignedTo") || undefined;
  const orderId = url.searchParams.get("id") || undefined;

  if (orderId) {
    const order = await getTailorOrderById(orderId);
    if (!order) return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
    return NextResponse.json(order, { headers: NO_STORE_HEADERS });
  }

  const orders = await getTailorOrders(assignedTo);
  return NextResponse.json(orders, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<TailorOrder>;
  
  if (!payload.inventoryId || !payload.assignedTo || !payload.adjustmentType || !payload.description) {
    return NextResponse.json({ message: "Dados do pedido de costura incompletos." }, { status: 400 });
  }

  const order: Omit<TailorOrder, "id" | "createdAt" | "updatedAt"> = {
    inventoryId: payload.inventoryId,
    assignedTo: payload.assignedTo,
    adjustmentType: payload.adjustmentType,
    description: payload.description,
    measurements: payload.measurements,
    status: "Novo",
    notes: payload.notes,
    completedAt: undefined,
  };

  const created = await createTailorOrder(order);
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = await request.json();
  const { id, confirmCompletion, ...updates } = payload as { id?: string; confirmCompletion?: boolean } & Partial<TailorOrder>;

  if (!id) {
    return NextResponse.json({ message: "ID do pedido é obrigatório." }, { status: 400 });
  }

  if (confirmCompletion) {
    const currentOrder = await getTailorOrderById(id);
    if (!currentOrder) {
      return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
    }

    if (currentOrder.status !== "Finalizado") {
      return NextResponse.json({ message: "Só é possível confirmar pedidos já finalizados pela costureira." }, { status: 400 });
    }

    const updatedOrder = await updateTailorOrder(id, updates);
    const finalizedOrder = updatedOrder ?? currentOrder;

    const updatedInventory = await updateInventory(finalizedOrder.inventoryId, {
      status: "Alugado",
      location: "Retirado",
      action: "Ver Pedido",
    });

    if (!updatedInventory) {
      return NextResponse.json({ message: "Item de inventário não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ order: finalizedOrder, inventory: updatedInventory });
  }

  const updated = await updateTailorOrder(id, updates);
  if (!updated) return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
  
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID do pedido é obrigatório." }, { status: 400 });
  }

  const deleted = await deleteTailorOrder(id);
  if (!deleted) return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });

  return NextResponse.json({ message: "Pedido deletado com sucesso." });
}
