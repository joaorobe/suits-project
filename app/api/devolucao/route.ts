import { NextResponse } from "next/server";
import { createReturnOrder, getReturnOrders } from "../../../lib/data";
import { withTransaction } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

type ReturnDestination = "inventario" | "lavanderia";

function isReturnDestination(value: unknown): value is ReturnDestination {
  return value === "inventario" || value === "lavanderia";
}

export async function GET() {
  try {
    const orders = await getReturnOrders();
    return NextResponse.json(orders, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Devolucao GET error:", error);
    return NextResponse.json({ message: "Erro interno ao carregar devoluções." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = await request.json();
  const { client, itemId, item, dueDate, status, penalty, action, amountPaid, damageFee, laundryStatus } = payload as {
    client?: string;
    itemId?: string;
    item?: string;
    dueDate?: string;
    status?: "Aguardando" | "Atrasado" | "Devolvido";
    penalty?: string;
    action?: string;
    amountPaid?: number;
    damageFee?: number;
    laundryStatus?: "Pendente" | "Em lavanderia" | "Concluído";
  };

  if (!client || !itemId || !item || !dueDate || !status || !penalty || !action) {
    return NextResponse.json({ message: "Dados de devolução incompletos." }, { status: 400 });
  }

  try {
    const order = await createReturnOrder({
      client,
      itemId,
      item,
      dueDate,
      status,
      penalty,
      action,
      amountPaid,
      damageFee,
      laundryStatus,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Devolucao POST error:", error);
    return NextResponse.json({ message: "Erro interno ao criar devolução." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const payload = await request.json();
  const { order, itemId, status, returnedDate, penalty, damageFee, laundryStatus, destination } = payload as {
    order?: string;
    itemId?: string;
    status?: string;
    returnedDate?: string;
    penalty?: string;
    damageFee?: number;
    laundryStatus?: string;
    destination?: ReturnDestination;
  };

  if (!order || !itemId || !status || !isReturnDestination(destination)) {
    return NextResponse.json({ message: "Pedido e status são obrigatórios." }, { status: 400 });
  }

  try {
    const inventoryUpdate = destination === "inventario"
      ? {
          status: "Disponível",
          location: "Estoque Central",
          stock: 1,
          action: "Reservar Traje",
        }
      : {
          status: "Lavanderia",
          location: "Lavanderia",
          stock: 0,
          action: "Voltar Disponível",
        };

    const effectiveLaundryStatus = laundryStatus ?? (destination === "inventario" ? "Concluído" : "Em lavanderia");

    await withTransaction(async (client) => {
      const pendingPayment = await client.query(
        `SELECT id, payment_type FROM payments WHERE item_id = $1 AND status = 'Pendente' LIMIT 1`,
        [itemId]
      );

      if ((pendingPayment.rowCount ?? 0) > 0) {
        const payment = pendingPayment.rows[0] as { id: string; payment_type: string };
        const paymentLabel = payment.payment_type === "Multa" ? "multa" : "pagamento";
        const businessRuleError = new Error(`Não foi possível confirmar a devolução: existe ${paymentLabel} pendente para este traje.`) as Error & { statusCode: number };
        businessRuleError.statusCode = 409;
        throw businessRuleError;
      }

      const updatedReturn = await client.query(
        `UPDATE return_orders
         SET status = $1,
             returned_date = $2,
             penalty = $3,
             damage_fee = $4,
             laundry_status = $5,
             action = $6
         WHERE order_id = $7
         RETURNING *`,
        [status, returnedDate ?? null, penalty ?? "-", damageFee ?? null, effectiveLaundryStatus, "Entregue", order]
      );

      if ((updatedReturn.rowCount ?? 0) === 0) {
        throw new Error("Pedido não encontrado.");
      }

      const returnRow = updatedReturn.rows[0] as {
        order_id: string;
        client: string;
        item_id: string;
        item: string;
      };

      const updatedInventory = await client.query(
        `UPDATE inventory
         SET status = $1,
             location = $2,
             stock = $3,
             action = $4
         WHERE id = $5
         RETURNING id`,
        [inventoryUpdate.status, inventoryUpdate.location, inventoryUpdate.stock, inventoryUpdate.action, itemId]
      );

      if ((updatedInventory.rowCount ?? 0) === 0) {
        throw new Error("Item do inventário não encontrado.");
      }

      if (typeof damageFee === "number" && Number.isFinite(damageFee) && damageFee > 0) {
        const existingFine = await client.query(
          `SELECT id FROM payments WHERE item_id = $1 AND payment_type = 'Multa' AND status = 'Pendente' LIMIT 1`,
          [itemId]
        );

        if ((existingFine.rowCount ?? 0) === 0) {
          const finePaymentId = `PAY-${Date.now()}`;
          await client.query(
            `INSERT INTO payments (id, item_id, item_title, plan, payment_type, amount, entry_amount, paid_amount, status, client_name, client_phone, client_email)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, NULL)`,
            [
              finePaymentId,
              returnRow.item_id,
              `Multa - ${returnRow.item}`,
              "Diário",
              "Multa",
              damageFee,
              0,
              0,
              "Pendente",
              returnRow.client,
            ]
          );
        }
      }
    });

    return NextResponse.json({ message: "Devolução confirmada." });
  } catch (error) {
    console.error("Devolucao PATCH error:", error);
    const statusCode = typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : 500;
    const message = error instanceof Error ? error.message : "Erro interno ao atualizar pedido.";
    return NextResponse.json({ message }, { status: Number.isFinite(statusCode) ? statusCode : 500 });
  }
}
