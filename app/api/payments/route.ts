import { NextResponse } from "next/server";
import { createPayment, getPayments, updatePayment } from "../../../lib/data";
import type { PaymentRecord } from "../../../lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\d{10,13}$/.test(value);
}

export async function GET() {
  try {
    const payments = await getPayments();
    return NextResponse.json(payments, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ message: "Erro interno ao carregar pagamentos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<PaymentRecord>;
  const clientName = typeof payload.clientName === "string" ? payload.clientName.trim() : "";
  const clientPhone = normalizePhone(payload.clientPhone);
  const clientEmail = normalizeEmail(payload.clientEmail);
  const paymentType: PaymentRecord["paymentType"] = payload.paymentType === "Multa" ? "Multa" : "Aluguel";
  const entryAmount = typeof payload.entryAmount === "number" ? payload.entryAmount : Number(payload.entryAmount);

  if (!payload.itemId || !payload.itemTitle || !payload.plan || payload.amount == null) {
    return NextResponse.json({ message: "Dados de pagamento incompletos." }, { status: 400 });
  }

  if (payload.plan !== "Diário" && payload.plan !== "Semanal") {
    return NextResponse.json({ message: "Plano de pagamento inválido." }, { status: 400 });
  }

  if (typeof payload.amount !== "number" || !Number.isFinite(payload.amount) || payload.amount <= 0) {
    return NextResponse.json({ message: "Valor de pagamento inválido." }, { status: 400 });
  }

  if (paymentType === "Aluguel" && (!Number.isFinite(entryAmount) || entryAmount < 50 || entryAmount > 100)) {
    return NextResponse.json({ message: "A entrada precisa estar entre R$ 50,00 e R$ 100,00." }, { status: 400 });
  }

  if (clientPhone && !isValidPhone(clientPhone)) {
    return NextResponse.json({ message: "Telefone inválido. Use apenas dígitos com 10 a 13 caracteres." }, { status: 400 });
  }

  if (clientEmail && !isValidEmail(clientEmail)) {
    return NextResponse.json({ message: "E-mail inválido." }, { status: 400 });
  }

  const payment = await createPayment({
    id: payload.id ?? `PAY-${Date.now()}`,
    itemId: payload.itemId,
    itemTitle: payload.itemTitle,
    plan: payload.plan,
    paymentType,
    amount: payload.amount,
    entryAmount: paymentType === "Multa" ? 0 : entryAmount,
    paidAmount: payload.paidAmount ?? 0,
    status: payload.status ?? "Pendente",
    clientName: clientName || undefined,
    clientPhone: clientPhone || undefined,
    clientEmail: clientEmail || undefined,
  });

  return NextResponse.json(payment, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as Partial<PaymentRecord> & { id?: string };
  if (!payload.id) {
    return NextResponse.json({ message: "ID do pagamento é obrigatório." }, { status: 400 });
  }
  const currentPayments = await getPayments();
  const current = currentPayments.find((payment) => payment.id === payload.id);
  if (!current) {
    return NextResponse.json({ message: "Pagamento não encontrado." }, { status: 404 });
  }

  const incomingPaidAmount = typeof payload.paidAmount === "number" ? payload.paidAmount : Number(payload.paidAmount ?? 0);
  const nextPaidAmount = Math.min(current.amount, Math.max(0, (current.paidAmount ?? 0) + (Number.isFinite(incomingPaidAmount) ? incomingPaidAmount : 0)));
  const nextStatus: PaymentRecord["status"] = nextPaidAmount >= current.amount ? "Pago" : "Pendente";

  const updated = await updatePayment(payload.id, {
    paidAmount: nextPaidAmount,
    status: nextStatus,
  });

  if (!updated) {
    return NextResponse.json({ message: "Pagamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
