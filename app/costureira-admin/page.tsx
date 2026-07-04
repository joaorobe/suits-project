"use client";

import React, { useEffect, useState } from "react";
import { FiTrash2, FiChevronRight, FiFilter, FiSearch } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";
import type { TailorOrder, InventoryItem } from "../../lib/types";

function OrderDetailsModal({
  order,
  inventory,
  onClose,
  onUpdate,
  onInventoryUpdate,
}: {
  order: TailorOrder | null;
  inventory: InventoryItem | null;
  onClose: () => void;
  onUpdate: (updated: TailorOrder) => void;
  onInventoryUpdate: (updated: InventoryItem) => void;
}) {
  if (!order) return null;

  const [notes, setNotes] = useState(order.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleSaveNotes() {
    if (!order) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/tailor-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, notes }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar");
      const updated = await response.json();
      onUpdate(updated);
      onClose();
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmCompletion() {
    if (!order) return;
    setIsConfirming(true);
    try {
      const response = await fetch("/api/tailor-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, notes, confirmCompletion: true }),
      });
      if (!response.ok) throw new Error("Erro ao confirmar término");

      const result = await response.json();
      const updatedOrder = (result.order ?? result) as TailorOrder;
      const updatedInventory = result.inventory as InventoryItem | undefined;

      onUpdate(updatedOrder);
      if (updatedInventory) {
        onInventoryUpdate(updatedInventory);
      }
      onClose();
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setIsConfirming(false);
    }
  }

  const canConfirmCompletion = order.status === "Finalizado" && inventory?.status === "Costureira";

  const statusColors: Record<TailorOrder["status"], string> = {
    "Novo": "bg-blue-100 text-blue-800",
    "Iniciado": "bg-amber-100 text-amber-800",
    "Finalizado": "bg-emerald-100 text-emerald-800",
    "Observação": "bg-purple-100 text-purple-800",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#17182b]">{order.adjustmentType}</h2>
            <p className="text-sm text-slate-500 mt-1">{order.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <div className="space-y-6">
          {inventory && (
            <div className="bg-slate-50 rounded-[24px] p-4 border border-slate-200">
              <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide mb-2">Traje</h3>
              <p className="font-semibold text-[#17182b]">{inventory.title} - {inventory.subtitle}</p>
              <p className="text-sm text-slate-600 mt-1">Tamanho: {inventory.size} | Cor: {inventory.color}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-[24px] p-4 border border-slate-200">
            <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide mb-3">Descrição do Ajuste</h3>
            <p className="text-slate-700">{order.description}</p>
          </div>

          {order.measurements && (
            <div className="bg-slate-50 rounded-[24px] p-4 border border-slate-200">
              <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide mb-2">Medidas</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{order.measurements}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
              <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>{order.status}</p>
            </div>
            <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Criado em</p>
              <p className="font-semibold text-sm text-[#17182b]">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Atualizado</p>
              <p className="font-semibold text-sm text-[#17182b]">{new Date(order.updatedAt).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide mb-3">Observações</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o andamento..."
              className="w-full rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white resize-none h-24"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#17182b] transition hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleSaveNotes} disabled={isSaving} className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {isSaving ? "Salvando..." : "Salvar Observações"}
            </button>
          </div>

          {canConfirmCompletion ? (
            <button
              onClick={handleConfirmCompletion}
              disabled={isConfirming}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {isConfirming ? "Confirmando..." : "Confirmar término e mover para Alugado"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, inventory, onViewDetails, onDelete }: { order: TailorOrder; inventory: InventoryItem | null; onViewDetails: () => void; onDelete: () => void }) {
  const statusBadgeColors: Record<TailorOrder["status"], string> = {
    "Novo": "bg-blue-100 text-blue-700",
    "Iniciado": "bg-amber-100 text-amber-700",
    "Finalizado": "bg-emerald-100 text-emerald-700",
    "Observação": "bg-purple-100 text-purple-700",
  };

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition">
      <td className="px-6 py-4">
        <p className="font-mono text-xs text-slate-500">{order.id}</p>
        <p className="font-semibold text-[#17182b] mt-1">{order.adjustmentType}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-slate-600">{inventory?.title || "—"}</p>
        <p className="text-xs text-slate-500 mt-1">{inventory?.subtitle || "—"}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-slate-700">{order.description.substring(0, 40)}...</p>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeColors[order.status]}`}>
          {order.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-slate-600">{new Date(order.updatedAt).toLocaleDateString("pt-BR")}</p>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button onClick={onViewDetails} className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 transition">
            <FiChevronRight className="text-lg" />
          </button>
          <button onClick={onDelete} className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 transition">
            <FiTrash2 className="text-lg" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CostureiraAdminPage() {
  const [orders, setOrders] = useState<TailorOrder[]>([]);
  const [inventories, setInventories] = useState<Map<string, InventoryItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<TailorOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TailorOrder["status"] | "">("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch("/api/tailor-orders");
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);

        const inventoriesResponse = await fetch("/api/inventory");
        const inventoriesData = await inventoriesResponse.json();
        const inventoryMap = new Map<string, InventoryItem>();
        if (Array.isArray(inventoriesData)) {
          inventoriesData.forEach((item: InventoryItem) => {
            inventoryMap.set(item.id, item);
          });
        }
        setInventories(inventoryMap);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleDeleteOrder(id: string) {
    if (!confirm("Tem certeza que deseja deletar este pedido?")) return;
    try {
      const response = await fetch(`/api/tailor-orders?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar");
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.adjustmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    novo: orders.filter((o) => o.status === "Novo").length,
    iniciado: orders.filter((o) => o.status === "Iniciado").length,
    finalizado: orders.filter((o) => o.status === "Finalizado").length,
    observacao: orders.filter((o) => o.status === "Observação").length,
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen overflow-hidden bg-[#F3F5F8] font-sans">
        <Sidebar active="Costureira" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <header className="mb-8 rounded-[32px] bg-[#17182b] p-8 shadow-[0_30px_90px_rgba(23,24,43,0.14)] text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Gerenciamento</p>
                <h1 className="mt-2 text-4xl font-serif font-semibold">Pedidos de Ajuste</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-200">Acompanhe o andamento dos pedidos enviados para a costureira.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/20">
                  Atualizar
                </button>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-4 mb-8">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
              <div className="text-sm text-slate-500 uppercase tracking-[0.18em]">Novo</div>
              <div className="mt-4 text-4xl font-semibold text-blue-600">{stats.novo}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
              <div className="text-sm text-slate-500 uppercase tracking-[0.18em]">Iniciado</div>
              <div className="mt-4 text-4xl font-semibold text-amber-600">{stats.iniciado}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
              <div className="text-sm text-slate-500 uppercase tracking-[0.18em]">Finalizado</div>
              <div className="mt-4 text-4xl font-semibold text-emerald-600">{stats.finalizado}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
              <div className="text-sm text-slate-500 uppercase tracking-[0.18em]">Observação</div>
              <div className="mt-4 text-4xl font-semibold text-purple-600">{stats.observacao}</div>
            </div>
          </section>

          <section className="rounded-[32px] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar pedidos..."
                    className="w-full rounded-2xl bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none border border-slate-200 focus:border-blue-400 focus:bg-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TailorOrder["status"] | "")}
                  className="rounded-2xl bg-slate-50 px-4 py-2 text-sm border border-slate-200 outline-none focus:border-blue-400 focus:bg-white"
                >
                  <option value="">Todos os status</option>
                  <option value="Novo">Novo</option>
                  <option value="Iniciado">Iniciado</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Observação">Observação</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Pedido</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Traje</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Atualizado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <FiFilter className="mx-auto mb-2 text-3xl text-slate-300" />
                        <p className="font-semibold">Nenhum pedido encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        inventory={inventories.get(order.inventoryId) || null}
                        onViewDetails={() => setSelectedOrder(order)}
                        onDelete={() => handleDeleteOrder(order.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        inventory={selectedOrder ? inventories.get(selectedOrder.inventoryId) || null : null}
        onClose={() => setSelectedOrder(null)}
        onUpdate={(updated) => {
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          setSelectedOrder(updated);
        }}
        onInventoryUpdate={(updatedInventory) => {
          setInventories((prev) => {
            const next = new Map(prev);
            next.set(updatedInventory.id, updatedInventory);
            return next;
          });
        }}
      />
    </AuthGuard>
  );
}
