"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiCreditCard, FiCheckCircle, FiClock, FiDownload, FiSearch } from "react-icons/fi";
import QRCode from "qrcode";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";
import type { PaymentRecord } from "../../lib/types";

export default function PaymentsClient({ initialPayments }: { initialPayments: PaymentRecord[] }) {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [qrMode, setQrMode] = useState<"entrada" | "saldo" | "total">("entrada");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) =>
        [payment.id, payment.itemId, payment.itemTitle, payment.plan, payment.paymentType, payment.status, payment.clientName, payment.clientPhone, payment.clientEmail]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const priority = (record: PaymentRecord) => {
          if (record.status !== "Pago" && record.paymentType === "Multa") return 0;
          if (record.status !== "Pago") return 1;
          return 2;
        };

        const byPriority = priority(a) - priority(b);
        if (byPriority !== 0) return byPriority;

        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });
  }, [payments, search]);

  const totalDue = useMemo(
    () => payments.reduce((sum, record) => sum + Math.max(record.amount - (record.paidAmount ?? 0), 0), 0),
    [payments]
  );

  const totalCollected = useMemo(
    () => payments.reduce((sum, record) => sum + (record.paidAmount ?? 0), 0),
    [payments]
  );

  const activePayment = payments.find((payment) => payment.id === activePaymentId);
  const isFinePayment = activePayment?.paymentType === "Multa";
  const entryAmount = activePayment?.entryAmount ?? 0;
  const paidAmount = activePayment?.paidAmount ?? 0;
  const remainingAmount = activePayment ? Math.max(activePayment.amount - paidAmount, 0) : 0;
  const qrAmount = activePayment
    ? isFinePayment
      ? activePayment.amount
      : qrMode === "entrada"
      ? entryAmount
      : qrMode === "saldo"
        ? remainingAmount
        : activePayment.amount
    : 0;

  useEffect(() => {
    if (!activePayment) {
      setQrCodeDataUrl(null);
      setQrMode("entrada");
      return;
    }

    setQrMode(activePayment.paymentType === "Multa" ? "total" : "entrada");
  }, [activePayment]);

  useEffect(() => {
    let cancelled = false;

    async function generateQr() {
      if (!activePayment || qrAmount <= 0) {
        setQrCodeDataUrl(null);
        return;
      }

      const payload = [
        "SUITS-PIX",
        activePayment.id,
        activePayment.itemTitle,
        `valor:${qrAmount.toFixed(2)}`,
        `cliente:${activePayment.clientName || ""}`,
      ].join("|");

      const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 256,
      });

      if (!cancelled) {
        setQrCodeDataUrl(dataUrl);
      }
    }

    generateQr().catch((error) => {
      console.error("Erro ao gerar QR code:", error);
      setQrCodeDataUrl(null);
    });

    return () => {
      cancelled = true;
    };
  }, [activePayment, qrAmount]);

  async function handleMarkPaid(paymentId: string) {
    try {
      const response = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, paidAmount: qrAmount }),
      });
      if (!response.ok) {
        throw new Error("Falha ao marcar pagamento como pago.");
      }
      const updatedPayment = await response.json();
      setPayments((prev) => prev.map((record) => (record.id === updatedPayment.id ? updatedPayment : record)));
      setQrCodeDataUrl(null);
      setQrMode("entrada");
    } catch (error) {
      console.error(error);
    }
  }

  function renderPaymentStatus(record: PaymentRecord) {
    const paid = record.paidAmount ?? 0;
    if (record.status === "Pago" || paid >= record.amount) {
      return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Pago</span>;
    }
    if (paid > 0) {
      return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Entrada confirmada</span>;
    }
    return <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">Pendente</span>;
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen overflow-hidden bg-[#F3F5F8] font-sans dark:bg-slate-950">
      <Sidebar active="Pagamentos" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <header className="mb-8 rounded-[32px] bg-[#17182b] p-8 shadow-[0_30px_90px_rgba(23,24,43,0.14)] text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <nav className="text-sm text-slate-200/80 mb-3">Menu &gt; Pagamentos</nav>
              <h1 className="text-4xl sm:text-5xl font-serif font-semibold flex items-center gap-3">
                <FiCreditCard className="text-[var(--suit-gold)] text-3xl" />
                Pagamentos
              </h1>
              <p className="text-base text-slate-200/80 mt-2 max-w-2xl">
                Gerencie cobranças, visualize pedidos e gere comprovantes rápidos para trajes alugados.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-flow-col sm:auto-cols-max">
              <button className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/15">
                <FiDownload className="mr-2 text-lg" /> Exportar relatorio
              </button>
              <button className="inline-flex items-center justify-center rounded-2xl bg-[#17182b] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 ring-1 ring-white/10 transition hover:bg-slate-900">
                Novo pagamento
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Resumo</p>
                  <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Fluxo de pagamentos</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">A receber</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">R$ {totalDue.toFixed(2)}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Recebido</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">R$ {totalCollected.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pedidos de pagamento</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Veja todos os pedidos criados a partir das reservas de trajes.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar pagamento"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredPayments.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                    Nenhum pagamento encontrado. Faça uma reserva no inventário para criar pedidos.
                  </div>
                ) : (
                  filteredPayments.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setActivePaymentId(record.id)}
                      className={`w-full px-6 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${record.paymentType === "Multa" ? "bg-red-50/50 dark:bg-red-500/10" : ""}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className={`text-sm font-semibold ${record.paymentType === "Multa" ? "text-red-700 dark:text-red-300" : "text-slate-900 dark:text-slate-100"}`}>{record.itemTitle}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Pedido {record.id} • Item {record.itemId} • Plano {record.plan}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {record.paymentType === "Multa" ? (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300">Multa</span>
                          ) : null}
                          {renderPaymentStatus(record)}
                          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">R$ {record.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Detalhes rápidos</h3>
              {activePayment ? (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Pagamento</p>
                    <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{activePayment.id}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Item / Pedido</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{activePayment.itemTitle}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">ID do item: {activePayment.itemId}</p>
                  </div>
                  {activePayment.paymentType === "Multa" ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                      Pagamento de multa por avaria
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Valor</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">R$ {activePayment.amount.toFixed(2)}</p>
                  </div>
                  {activePayment.paymentType !== "Multa" ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Entrada configurada</p>
                      <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">R$ {(activePayment.entryAmount ?? 0).toFixed(2)}</p>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Valor já pago</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">R$ {paidAmount.toFixed(2)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Saldo restante</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">R$ {remainingAmount.toFixed(2)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                    {renderPaymentStatus(activePayment)}
                  </div>
                  <div className="rounded-3xl bg-slate-100 p-4 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Cliente</p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{activePayment.clientName || "Não informado"}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activePayment.clientPhone || "-"}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activePayment.clientEmail || "-"}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-100 p-4 dark:bg-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400">QR de pagamento</p>
                      <div className="flex flex-wrap gap-2">
                        {activePayment.paymentType !== "Multa" ? (
                          <>
                        <button type="button" onClick={() => setQrMode("entrada")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${qrMode === "entrada" ? "bg-[#17182b] text-white" : "bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
                          Entrada
                        </button>
                        <button type="button" onClick={() => setQrMode("saldo")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${qrMode === "saldo" ? "bg-[#17182b] text-white" : "bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
                          Saldo
                        </button>
                          </>
                        ) : null}
                        <button type="button" onClick={() => setQrMode("total")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${qrMode === "total" ? "bg-[#17182b] text-white" : "bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
                          {activePayment.paymentType === "Multa" ? "Multa" : "Total"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col items-center justify-center rounded-3xl bg-white p-4 text-slate-400 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                      {qrCodeDataUrl ? (
                        <>
                          <img src={qrCodeDataUrl} alt="QR code do pagamento" className="h-40 w-40 rounded-2xl" />
                          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                            Gerado para R$ {qrAmount.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <span className="text-sm">QR indisponível para este valor.</span>
                      )}
                    </div>
                  </div>
                  {activePayment.status === "Pendente" ? (
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(activePayment.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                    >
                      <FiCheckCircle className="text-lg" /> Confirmar valor selecionado
                    </button>
                  ) : (
                    <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Aluguel confirmado</div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl bg-slate-50 p-6 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Selecione um pedido para ver detalhes, gerar QR e marcar pagamento.
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Instruções</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Os pedidos de pagamento são gerados automaticamente na reserva de trajes no inventário. Use esta área para acompanhar cobranças e marcar pagamentos recebidos.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
