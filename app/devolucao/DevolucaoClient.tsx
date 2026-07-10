"use client";

import React, { useMemo, useState } from "react";
import { FiSearch, FiFilter, FiUser } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";
import type { ReturnOrder } from "../../lib/types";

type ReturnDestination = "inventario" | "lavanderia";

const DESTINATION_OPTIONS: Array<{
  value: ReturnDestination;
  label: string;
  inventoryStatus: "Disponível" | "Lavanderia";
  inventoryLocation: string;
  laundryStatus: NonNullable<ReturnOrder["laundryStatus"]>;
}> = [
  {
    value: "inventario",
    label: "Inventário",
    inventoryStatus: "Disponível",
    inventoryLocation: "Estoque Central",
    laundryStatus: "Concluído",
  },
  {
    value: "lavanderia",
    label: "Lavanderia",
    inventoryStatus: "Lavanderia",
    inventoryLocation: "Lavanderia",
    laundryStatus: "Em lavanderia",
  },
];

function StatCard({ label, value }: { label: string; value: string | number }) {
  const labelColor =
    label === "Aguardando"
      ? "text-orange-600"
      : label === "Atrasados"
      ? "text-red-600"
      : label === "Finalizados (Hoje)"
      ? "text-slate-500"
      : "text-emerald-600";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
      <div className={`text-sm uppercase tracking-[0.2em] ${labelColor} mb-3`}>{label}</div>
      <div className={`text-3xl font-semibold ${labelColor}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnOrder["status"] }) {
  const statusStyles: Record<ReturnOrder["status"], string> = {
    Aguardando: "bg-amber-100 text-amber-700 border border-amber-200",
    Atrasado: "bg-red-100 text-red-700 border border-red-200",
    Devolvido: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

export default function DevolucaoClient({ initialOrders }: { initialOrders: ReturnOrder[] }) {
  const [tab, setTab] = useState("Todas");
  const [orders, setOrders] = useState<ReturnOrder[]>(initialOrders);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null);
  const [hasDamage, setHasDamage] = useState(false);
  const [damageFee, setDamageFee] = useState(50);
  const [returnDestination, setReturnDestination] = useState<ReturnDestination>("inventario");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (tab === "Pendentes") return order.status === "Aguardando";
      if (tab === "Atrasadas") return order.status === "Atrasado";
      if (tab === "Concluídas") return order.status === "Devolvido";
      return true;
    }).filter((order) =>
      [order.order, order.client, order.item, order.status, order.dueDate]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, tab, orders]);

  async function handleConfirm(order: ReturnOrder) {
    const destination = DESTINATION_OPTIONS.find((option) => option.value === returnDestination) ?? DESTINATION_OPTIONS[0];
    const completedOrder: ReturnOrder = {
      ...order,
      status: "Devolvido",
      returnedDate: new Date().toLocaleString(),
      penalty: hasDamage ? `R$ ${damageFee.toFixed(2)}` : "-",
      damageFee: hasDamage ? damageFee : 0,
      laundryStatus: destination.laundryStatus,
      action: "Entregue",
    };

    try {
      setMessage(null);
      const response = await fetch("/api/devolucao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: order.order,
          itemId: order.itemId,
          status: "Devolvido",
          returnedDate: completedOrder.returnedDate,
          penalty: completedOrder.penalty,
          damageFee: completedOrder.damageFee,
          laundryStatus: completedOrder.laundryStatus,
          destination: destination.value,
        }),
      });
      if (!response.ok) {
        let errorMessage = "Falha ao atualizar devolução.";
        try {
          const body = await response.json();
          if (typeof body?.message === "string" && body.message.trim()) {
            errorMessage = body.message;
          }
        } catch {
        }
        throw new Error(errorMessage);
      }

      setOrders((prev) => prev.map((item) => (item.order === order.order ? completedOrder : item)));
      setMessage("Devolução confirmada com sucesso.");
      setSelectedOrder(null);
      setHasDamage(false);
      setDamageFee(50);
      setReturnDestination("inventario");
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Falha ao confirmar devolução.");
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen overflow-hidden bg-[#F3F5F8] font-sans">
        <Sidebar active="Devolução" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <header className="mb-8 rounded-[32px] bg-[#17182b] p-8 shadow-[0_30px_90px_rgba(23,24,43,0.14)] text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-serif font-semibold">Gestão de Devoluções</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-200">Acompanhe e gerencie devoluções, multas e itens em atraso com clareza e controle.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.08)]">
                  <FiSearch className="text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar pedido ou cliente"
                    className="w-full bg-transparent text-sm text-[#17182b] outline-none"
                  />
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#17182b] shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition hover:bg-slate-100">
                  <FiFilter /> Filtrar
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 mb-6 xl:grid-cols-4">
            <StatCard label="Total Atribuído" value={orders.length} />
            <StatCard label="Aguardando" value={orders.filter((order) => order.status === "Aguardando").length} />
            <StatCard label="Atrasados" value={orders.filter((order) => order.status === "Atrasado").length} />
            <StatCard label="Finalizados (Hoje)" value={orders.filter((order) => order.status === "Devolvido").length} />
          </div>

          {message ? (
            <div className="mb-6 rounded-3xl border border-orange-200 bg-orange-50 px-6 py-4 text-sm text-orange-800 shadow-sm">{message}</div>
          ) : null}

          <div className="bg-white rounded-[28px] p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)] mb-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <nav className="flex flex-wrap gap-3">
                {["Todas", "Pendentes", "Atrasadas", "Concluídas"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? "bg-[#17182b] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {t}
                  </button>
                ))}
              </nav>

              <div className="flex flex-wrap gap-3">
                <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100">12 Mai - 19 Mai</button>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-[#17182b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900">
                  <FiFilter /> Filtros
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-[0.15em]">
                  <tr>
                    <th className="px-6 py-4 w-12"><input type="checkbox" /></th>
                    <th className="px-6 py-4">Pedido/Cliente</th>
                    <th className="px-6 py-4">Itens</th>
                    <th className="px-6 py-4">Data Prevista</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Multas/Avarias</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                        Nenhuma devolução encontrada. Quando houver dados na API, eles aparecerão aqui.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((s) => (
                      <tr key={s.order} className="border-t last:border-b">
                        <td className="px-6 py-5 align-top"><input type="checkbox" className="h-4 w-4 text-[#17182b]" /></td>
                        <td className="px-6 py-5 align-top">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><FiUser /></div>
                            <div>
                              <div className="text-xs text-slate-400">{s.order}</div>
                              <div className="font-semibold text-[#17182b]">{s.client}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <div className="text-xs text-slate-400">{s.itemId}</div>
                          <div className="text-sm text-slate-700">{s.item}</div>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <div className="font-medium text-slate-700">{s.dueDate}</div>
                          {s.returnedDate ? (
                            <div suppressHydrationWarning className="text-xs text-red-500 mt-1">
                              {s.returnedDate}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-6 py-5 align-top"><StatusBadge status={s.status} /></td>
                        <td className="px-6 py-5 align-top">
                          <div className="text-sm text-slate-600">{s.penalty}</div>
                          <div suppressHydrationWarning className="mt-1 text-xs text-slate-400">{s.laundryStatus || "-"}</div>
                        </td>
                        <td className="px-6 py-5 align-top">
                          {s.action === "Confirmar" ? (
                            <button onClick={() => { setSelectedOrder(s); setHasDamage(Boolean(s.damageFee)); setDamageFee(s.damageFee ?? 50); setReturnDestination(s.laundryStatus === "Em lavanderia" ? "lavanderia" : "inventario"); }} className="rounded-2xl bg-[#17182b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900">{s.action}</button>
                          ) : (
                            <button className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-600" disabled>{s.action}</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 items-center justify-between border-t border-slate-200 p-5 sm:flex-row">
              <div className="text-sm text-slate-500">Mostrando {filteredOrders.length} de {orders.length} devoluções</div>
              <div className="flex items-center gap-2">
                <button className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">◀</button>
                <div className="flex gap-2">
                  <button className="w-10 rounded-2xl bg-[#17182b] px-2 py-2 text-sm font-semibold text-white">1</button>
                  <button className="w-10 rounded-2xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600">2</button>
                  <button className="w-10 rounded-2xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600">3</button>
                </div>
                <button className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">▶</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Confirmar devolução</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#17182b]">{selectedOrder.item}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">×</button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Danos ou avarias?
                <select
                  value={hasDamage ? "Sim" : "Não"}
                  onChange={(e) => setHasDamage(e.target.value === "Sim")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                >
                  <option>Não</option>
                  <option>Sim</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Destino após devolução
                <select
                  value={returnDestination}
                  onChange={(e) => setReturnDestination(e.target.value as ReturnDestination)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                >
                  {DESTINATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {hasDamage ? (
                <label className="block text-sm font-medium text-slate-600 sm:col-span-2">
                  Valor da multa
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={damageFee}
                    onChange={(e) => setDamageFee(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                  />
                </label>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelectedOrder(null)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancelar</button>
              <button onClick={() => handleConfirm(selectedOrder)} className="rounded-2xl bg-[#17182b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">Confirmar devolução</button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthGuard>
  );
}
