"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiUser, FiFilter, FiChevronDown, FiEdit2, FiCheck, FiRefreshCw } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";
import type { TailorOrder, InventoryItem } from "../../lib/types";

function SmallStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const defaultColor =
    label === "Novo"
      ? "text-blue-600"
      : label === "Iniciado"
      ? "text-amber-600"
      : label === "Finalizado"
      ? "text-emerald-600"
      : "text-slate-500";

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-500 sm:mb-3 sm:text-sm dark:text-slate-300">{label}</div>
      <div className={`text-3xl font-semibold ${color || defaultColor}`}>{value}</div>
    </div>
  );
}

function getStatusStyles(status: TailorOrder["status"]) {
  switch (status) {
    case "Novo":
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
    case "Iniciado":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    case "Finalizado":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    default:
      return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300";
  }
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data invalida";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({
  order,
  inventory,
  expanded,
  onToggle,
  onUpdateStatus,
}: {
  order: TailorOrder;
  inventory: InventoryItem | null;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, status: TailorOrder["status"]) => void;
}) {
  const statusColors: Record<TailorOrder["status"], { bg: string; text: string; border: string }> = {
    Novo: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-500/40" },
    Iniciado: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-500/40" },
    Finalizado: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-500/40" },
    "Observação": { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-500/40" },
  };

  const colors = statusColors[order.status];
  const nextStatus: Record<TailorOrder["status"], TailorOrder["status"] | null> = {
    Novo: "Iniciado",
    Iniciado: "Finalizado",
    Finalizado: null,
    "Observação": "Iniciado",
  };

  const next = nextStatus[order.status];
  const canSetObservation = order.status !== "Observação";
  const actionLabel = order.status === "Novo" ? "Iniciar" : order.status === "Iniciado" ? "Finalizar" : order.status === "Observação" ? "Retomar" : "Concluir";
  const suitLabel = inventory ? `${inventory.title}${inventory.subtitle ? ` - ${inventory.subtitle}` : ""}` : "Traje nao encontrado";
  const chevronClass = expanded ? "rotate-180" : "rotate-0";
  const statusClass = getStatusStyles(order.status);

  return (
    <article className={`overflow-hidden rounded-[24px] border ${colors.border} bg-white shadow-sm dark:bg-slate-900`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5 dark:hover:bg-slate-800"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{order.adjustmentType}</p>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">ID {order.id}</p>
            <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">Traje: {suitLabel}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{order.status}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{formatOrderDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {order.status === "Novo" ? (
              <span className="rounded-full bg-[#17182b] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Novo pedido</span>
            ) : null}
            <FiChevronDown className={`text-lg text-slate-500 transition-transform dark:text-slate-300 ${chevronClass}`} />
          </div>
        </div>
      </button>

      {expanded ? (
        <div className={`border-t px-4 pb-4 pt-4 sm:px-5 ${colors.border} ${colors.bg}`}>
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Descricao</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{order.description}</p>
            </div>

            {inventory && (
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <p>
                  <span className="font-semibold">Traje:</span> {suitLabel}
                </p>
                <p>
                  <span className="font-semibold">Tamanho:</span> {inventory.size} | <span className="font-semibold">Cor:</span> {inventory.color}
                </p>
              </div>
            )}

            {order.measurements ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Medidas</p>
                <p className="mt-1">{order.measurements}</p>
              </div>
            ) : null}

            {order.notes ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Observacoes</p>
                <p className="mt-1">{order.notes}</p>
              </div>
            ) : null}

            <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2 dark:text-slate-400">
              <p>Criado em: {formatOrderDate(order.createdAt)}</p>
              <p>Atualizado em: {formatOrderDate(order.updatedAt)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {next ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, next)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17182b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                {order.status === "Novo" ? <FiEdit2 className="text-base" /> : <FiCheck className="text-base" />}
                {actionLabel}
              </button>
            ) : null}

            {canSetObservation ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, "Observação")}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400"
              >
                Marcar observacao
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function CostureiraPage() {
  const [orders, setOrders] = useState<TailorOrder[]>([]);
  const [inventories, setInventories] = useState<Map<string, InventoryItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id?: string; name?: string } | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (a.status === "Novo" && b.status !== "Novo") return -1;
      if (a.status !== "Novo" && b.status === "Novo") return 1;

      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });
  }, [orders]);

  async function loadData() {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("suits-auth-user");
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      setUser(currentUser);

      if (currentUser?.id) {
        const response = await fetch(`/api/tailor-orders?assignedTo=${currentUser.id}&ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);

        const inventoriesResponse = await fetch(`/api/inventory?ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        const inventoriesData = await inventoriesResponse.json();
        const map = new Map<string, InventoryItem>();
        if (Array.isArray(inventoriesData)) {
          inventoriesData.forEach((item: InventoryItem) => map.set(item.id, item));
        }
        setInventories(map);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (sortedOrders.length === 0) {
      setExpandedOrderId(null);
      return;
    }

    if (expandedOrderId && !sortedOrders.some((order) => order.id === expandedOrderId)) {
      setExpandedOrderId(null);
    }
  }, [sortedOrders, expandedOrderId]);

  async function handleUpdateStatus(id: string, status: TailorOrder["status"]) {
    try {
      const response = await fetch("/api/tailor-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, completedAt: status === "Finalizado" ? new Date().toISOString() : null }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar");
      const updated = await response.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setExpandedOrderId(updated.id);
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  const novo = orders.filter((x) => x.status === "Novo").length;
  const iniciado = orders.filter((x) => x.status === "Iniciado").length;
  const finalizado = orders.filter((x) => x.status === "Finalizado").length;
  const observacao = orders.filter((x) => x.status === "Observação").length;

  return (
    <AuthGuard>
      <div className="flex min-h-screen overflow-hidden bg-[#F3F5F8] font-sans dark:bg-slate-950">
        <Sidebar active="Costureira" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <header className="mb-6 rounded-[28px] bg-[#17182b] p-5 text-white shadow-[0_30px_90px_rgba(23,24,43,0.14)] sm:mb-8 sm:rounded-[32px] sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300 sm:text-sm">Costureira</p>
                <h1 className="mt-2 text-3xl font-serif font-semibold sm:text-4xl">Pedidos de Ajuste</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:mt-3">Toque no pedido para abrir os detalhes e atualizar o andamento do traje.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <FiUser className="text-lg" />
                  <span className="text-sm font-medium">{user?.name || "Costureira"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <FiRefreshCw className="text-base" /> Atualizar
                </button>
              </div>
            </div>
          </header>

          <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm sm:rounded-[28px] dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 sm:p-6 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-100">Pedidos recebidos</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Novo pedido mostra titulo, ID e traje. Toque para ver todas as opcoes.</p>
            </div>

            {loading ? (
              <div className="space-y-3 p-4 sm:p-6">
                {Array(3).fill(null).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-3 h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mb-2 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 sm:p-12 dark:text-slate-400">
                <FiFilter className="mx-auto mb-3 text-3xl text-slate-300 dark:text-slate-600" />
                <p className="font-semibold">Nenhum pedido de ajuste no momento</p>
                <p className="mt-1 text-sm">Os trajes que chegarem para ajuste aparecerao aqui.</p>
              </div>
            ) : (
              <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                {sortedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    inventory={inventories.get(order.inventoryId) || null}
                    expanded={expandedOrderId === order.id}
                    onToggle={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
