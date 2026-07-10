"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FiBell, FiBriefcase, FiX, FiPlus, FiUser } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";
import type { InventoryItem, PaymentRecord } from "../../lib/types";

function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhoneInput(value: string) {
  const digits = normalizePhoneInput(value).slice(0, 11);

  if (!digits) return "";
  if (digits.length < 3) return `(${digits}`;
  if (digits.length < 8) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\d{10,13}$/.test(value);
}

function actionByStatus(status: InventoryItem["status"]) {
  if (status === "Disponível") return "Reservar Traje";
  if (status === "Lavanderia") return "Voltar Disponível";
  return "Ver Pedido";
}

function normalizeInventoryItem(item: InventoryItem): InventoryItem {
  const nextAction = actionByStatus(item.status);
  if (item.action === nextAction) {
    return item;
  }

  return {
    ...item,
    action: nextAction,
  };
}

function StatusBadge({ status }: { status: InventoryItem["status"] }) {
  const map: Record<InventoryItem["status"], string> = {
    Disponível: "text-green-500",
    Costureira: "text-[var(--suit-gold)]",
    Alugado: "text-red-500",
    Lavanderia: "text-orange-400",
  };
  return <div className={`text-sm font-medium ${map[status] || "text-gray-300"}`}>{status}</div>;
}

function Card({ item, onAction }: { item: InventoryItem; onAction: (item: InventoryItem, plan: "Diário" | "Semanal") => void }) {
  const [plan, setPlan] = useState<"Diário" | "Semanal">("Diário");
  const price = item.price ?? 0;
  const estimate = plan === "Diário" ? price : Math.round(price * 7 * 0.7 * 100) / 100;

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
      <div className="relative h-64 w-full bg-slate-100">
        <Image src={item.image} alt={item.title} fill className="object-cover" />
      </div>
      <div className="bg-[#17182b] text-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold">{item.title}</h3>
            <p className="text-sm text-slate-200 mt-1">{item.subtitle}</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-xs text-slate-300">ID - {item.id}</div>
            <StatusBadge status={item.status} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3 text-sm text-slate-200">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Tamanho</div>
            <div className="mt-2 text-lg font-semibold">{item.size}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Cor</div>
            <div className="mt-2 text-lg font-semibold">{item.color}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Estoque</div>
            <div className="mt-2 text-lg font-semibold">{item.stock}</div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6">
        {item.action.includes("Reservar") ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">Plano de aluguel</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as "Diário" | "Semanal")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
              >
                <option>Diário</option>
                <option>Semanal</option>
              </select>
            </div>
            <div className="text-sm text-slate-500">
              {price > 0 ? `Estimativa: R$ ${estimate.toFixed(2)} ${plan === "Semanal" ? "para 7 dias (30% off)" : "por dia"}` : "Preço não definido para este traje."}
            </div>
          </div>
        ) : null}

        <button
          onClick={() => onAction(item, plan)}
          disabled={item.action.includes("Reservar") && price === 0}
          className="w-full rounded-2xl border border-[#17182b] bg-[#17182b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {item.action}
        </button>
      </div>
    </div>
  );
}

export default function InventoryClient({ initialItems, initialPayments, initialCostureiras }: {
  initialItems: InventoryItem[];
  initialPayments: PaymentRecord[];
  initialCostureiras: Array<{ id: string; name: string; role: string }>;
}) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>(() => initialItems.map(normalizeInventoryItem));
  const [activeTab, setActiveTab] = useState<"Todas" | InventoryItem["status"]>("Disponível");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const priceOptions = [
    { label: "Terno novo", price: 290 },
    { label: "Terno semi novo", price: 249.9 },
    { label: "Smoking", price: 350 },
    { label: "Vestido acompanhante novo", price: 290 },
    { label: "Vestido acompanhante semi novo", price: 249.9 },
    { label: "Vestido de noiva", price: 350 },
  ];

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    size: 42,
    color: "",
    location: "Estoque Central",
    stock: 1,
    status: "Disponível" as InventoryItem["status"],
    priceCategory: priceOptions[0].label,
    price: priceOptions[0].price,
    image: "/terno1.jpg",
  });
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [reservationItem, setReservationItem] = useState<InventoryItem | null>(null);
  const [reservationPlan, setReservationPlan] = useState<"Diário" | "Semanal">("Diário");
  const [reservationForm, setReservationForm] = useState({ clientName: "", clientPhone: "", clientEmail: "", entryAmount: 50 });
  const [sendToCostureira, setSendToCostureira] = useState(false);
  const [assignedTailorId, setAssignedTailorId] = useState(initialCostureiras[0]?.id ?? "");
  const [adjustmentType, setAdjustmentType] = useState("");
  const [adjustmentDescription, setAdjustmentDescription] = useState("");
  const [adjustmentMeasurements, setAdjustmentMeasurements] = useState("");
  const [viewedItem, setViewedItem] = useState<InventoryItem | null>(null);
  const [viewedPayment, setViewedPayment] = useState<PaymentRecord | null>(null);
  const [costureiras] = useState(initialCostureiras);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadInventoryFromServer = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/inventory?ts=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Falha ao atualizar inventário (${response.status}).`);
      }

      const freshItems = await response.json();
      if (Array.isArray(freshItems)) {
        setItems(freshItems.map((item) => normalizeInventoryItem(item as InventoryItem)));
      }
    } catch (error) {
      console.error("Falha ao sincronizar inventário:", error);
      if (!silent) {
        setMessage("Não foi possível sincronizar o inventário agora.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadInventoryFromServer(false);

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadInventoryFromServer(true);
      }
    };

    const syncWhenFocused = () => {
      void loadInventoryFromServer(true);
    };

    const intervalId = window.setInterval(() => {
      void loadInventoryFromServer(true);
    }, 15000);

    document.addEventListener("visibilitychange", syncWhenVisible);
    window.addEventListener("focus", syncWhenFocused);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      window.removeEventListener("focus", syncWhenFocused);
    };
  }, [loadInventoryFromServer]);

  const statusTabs: Array<"Todas" | InventoryItem["status"]> = ["Todas", "Disponível", "Alugado", "Lavanderia", "Costureira"];

  const mergedItems = useMemo(() => {
    const normalized = search.toLowerCase();
    return items.filter((item) => {
      const matchesTab = activeTab === "Todas" || item.status === activeTab;
      if (!matchesTab) return false;

      if (!normalized.trim()) return true;

      return [item.id, item.title, item.subtitle, item.sku, item.color, item.location, item.status]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [items, search, activeTab]);

  if (!mounted) {
    return null;
  }

  async function handleAddItem(event: React.FormEvent) {
    event.preventDefault();
    if (!formData.title || !formData.subtitle || !formData.color) {
      setMessage("Preencha título, subtítulo e cor antes de adicionar.");
      return;
    }

    const newItem: InventoryItem = {
      id: `INV-${Date.now()}`,
      title: formData.title,
      subtitle: formData.subtitle,
      sku: `SKU-${Date.now()}`,
      status: formData.status,
      size: formData.size,
      color: formData.color,
      location: formData.location,
      stock: formData.stock,
      image: formData.image,
      action: actionByStatus(formData.status),
      priceCategory: formData.priceCategory,
      price: formData.price,
    };

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) throw new Error("Falha no envio");
      const created = await response.json();
      setItems((prev) => [normalizeInventoryItem(created as InventoryItem), ...prev]);
      void loadInventoryFromServer(true);
      setMessage("Traje enviado com sucesso.");
      setShowForm(false);
      setFormData({
        title: "",
        subtitle: "",
        size: 42,
        color: "",
        location: "Estoque Central",
        stock: 1,
        status: "Disponível",
        priceCategory: priceOptions[0].label,
        price: priceOptions[0].price,
        image: "/terno1.jpg",
      });
    } catch (error) {
      console.error(error);
      setMessage("Erro ao cadastrar traje. Tente novamente.");
    }
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setFormData((prev) => ({ ...prev, image: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleItemAction(item: InventoryItem, plan: "Diário" | "Semanal") {
    if (item.status === "Disponível") {
      setReservationItem(item);
      setReservationPlan(plan);
      setReservationForm({ clientName: "", clientPhone: "", clientEmail: "", entryAmount: 50 });
      setMessage("Preencha os dados do cliente para confirmar a reserva.");
      return;
    }

    if (item.status === "Lavanderia") {
      const nextItem: InventoryItem = {
        ...item,
        status: "Disponível",
        location: "Estoque Central",
        stock: Math.max(1, item.stock),
        action: "Reservar Traje",
      };

      try {
        const response = await fetch(`/api/inventory/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextItem),
        });

        if (!response.ok) {
          throw new Error(`Falha ao atualizar item (${response.status}).`);
        }

        const updated = await response.json();
        setItems((prev) => prev.map((existing) => (existing.id === item.id ? normalizeInventoryItem(updated as InventoryItem) : existing)));
        setMessage(`Traje ${item.id} voltou para disponível.`);
      } catch (error) {
        console.error(error);
        setMessage("Não foi possível atualizar o traje agora.");
      }
      return;
    }

    if (item.action.includes("Ver")) {
      const payment = payments.find((record) => record.itemId === item.id);
      setViewedItem(item);
      setViewedPayment(payment ?? null);
      setMessage(payment ? `Pedido ${item.id} carregado com os dados do cliente.` : `Pedido ${item.id} visualizado.`);
      return;
    }

    setMessage("Ação não disponível para esse item.");
  }

  async function confirmReservation() {
    if (!reservationItem) return;

    const clientName = reservationForm.clientName.trim();
    const clientPhone = normalizePhoneInput(reservationForm.clientPhone);
    const clientEmail = reservationForm.clientEmail.trim().toLowerCase();
    const entryAmount = Number(reservationForm.entryAmount);

    if (!clientName) {
      setMessage("Informe o nome do cliente antes de confirmar a reserva.");
      return;
    }

    if (!isValidPhone(clientPhone)) {
      setMessage("Informe um telefone válido com 10 a 13 dígitos.");
      return;
    }

    if (!isValidEmail(clientEmail)) {
      setMessage("Informe um e-mail válido com formato correto.");
      return;
    }

    if (!Number.isFinite(entryAmount) || entryAmount < 50 || entryAmount > 100) {
      setMessage("A entrada deve ficar entre R$ 50,00 e R$ 100,00.");
      return;
    }

    if (sendToCostureira && !assignedTailorId) {
      setMessage("Selecione uma costureira antes de enviar o ajuste.");
      return;
    }

    if (sendToCostureira && !adjustmentType.trim()) {
      setMessage("Informe o tipo de ajuste antes de enviar para a costureira.");
      return;
    }

    const item = reservationItem;
    const plan = reservationPlan;
    const nextItem = {
      ...item,
      status: sendToCostureira ? "Costureira" as InventoryItem["status"] : "Alugado" as InventoryItem["status"],
      location: sendToCostureira ? "Costura" : "Retirado",
      stock: Math.max(0, item.stock - 1),
      action: "Ver Pedido",
    };

    const basePrice = item.price ?? 0;
    const estimate = plan === "Diário" ? basePrice : Math.round(basePrice * 7 * 0.7 * 100) / 100;

    try {
      const tailorPromise = sendToCostureira
        ? fetch("/api/tailor-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventoryId: item.id,
              assignedTo: assignedTailorId,
              adjustmentType: adjustmentType.trim(),
              description: adjustmentDescription.trim(),
              measurements: adjustmentMeasurements.trim(),
              status: "Novo",
              notes: "",
            }),
          })
        : Promise.resolve({ ok: true } as Response);

      const [inventoryRes, paymentRes, devolucaoRes, tailorRes] = await Promise.all([
        fetch(`/api/inventory/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextItem),
        }),
        fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: item.id,
            itemTitle: item.title,
            plan,
            amount: estimate,
            entryAmount,
            paidAmount: 0,
            status: "Pendente",
            clientName,
            clientPhone,
            clientEmail,
          }),
        }),
        fetch("/api/devolucao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: clientName,
            itemId: item.id,
            item: item.title,
            dueDate: plan === "Diário" ? "Hoje" : "Em 7 dias",
            status: "Aguardando",
            penalty: "-",
            action: "Confirmar",
            amountPaid: estimate,
            damageFee: 0,
            laundryStatus: "Pendente",
          }),
        }),
        tailorPromise,
      ]);

      const failedResponse = [inventoryRes, paymentRes, devolucaoRes, tailorRes].find((res) => !res.ok);
      if (failedResponse) {
        let errorText = "Erro inesperado";
        try {
          const bodyText = await failedResponse.text();
          if (bodyText) {
            const parsed = JSON.parse(bodyText);
            errorText = parsed?.message || bodyText;
          }
        } catch {
        }
        throw new Error(`Falha ao confirmar reserva no backend. ${failedResponse.status}: ${errorText}`);
      }

      const updated = await inventoryRes.json();
      setItems((prev) => prev.map((existing) => (existing.id === updated.id ? normalizeInventoryItem(updated as InventoryItem) : existing)));
      setPayments((prev) => [
        ...prev,
        {
          id: `PAY-${Date.now()}`,
          itemId: item.id,
          itemTitle: item.title,
          plan,
          amount: estimate,
          entryAmount,
          paidAmount: 0,
          status: "Pendente",
          clientName,
          clientPhone,
          clientEmail,
          createdAt: new Date().toISOString(),
        },
      ]);
      setReservationForm({ clientName: "", clientPhone: "", clientEmail: "", entryAmount: 50 });
      setMessage(`Reserva confirmada para ${clientName}.` + (sendToCostureira ? " Ajuste enviado para costureira." : ""));
      setReservationItem(null);
      setSendToCostureira(false);
      setAdjustmentType("");
      setAdjustmentDescription("");
      setAdjustmentMeasurements("");
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Erro ao confirmar reserva. Tente novamente.");
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen overflow-hidden bg-[#F3F5F8] font-sans">
        <Sidebar active="Inventário" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <header className="mb-8 rounded-[32px] bg-[#17182b] p-8 shadow-[0_30px_90px_rgba(23,24,43,0.14)] text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <nav className="text-sm text-slate-200/80 mb-3">Menu &gt; Inventário</nav>
                <h1 className="text-4xl sm:text-5xl font-serif font-semibold flex items-center gap-3">
                  <FiBriefcase className="text-[var(--suit-gold)] text-3xl" />
                  Inventário
                </h1>
                <p className="text-base text-slate-200/80 mt-2 max-w-2xl">Gerencie e rastreie localizações de seus trajes com visual limpo e foco em dados rápidos.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/15">Exportar</button>
                <button onClick={() => setShowForm((prev) => !prev)} className="inline-flex items-center justify-center rounded-2xl bg-[#17182b] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 ring-1 ring-white/10 transition hover:bg-slate-900">
                  Adicionar Traje
                </button>
              </div>
            </div>
          </header>

          {message ? (
            <div className="mb-6 rounded-3xl border border-orange-200 bg-orange-50 px-6 py-4 text-sm text-orange-800 shadow-sm">{message}</div>
          ) : null}

          {showForm ? (
            <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#17182b] mb-4">Novo traje</h2>
              <form onSubmit={handleAddItem} className="grid gap-4 lg:grid-cols-2">
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                />
                <input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Subtítulo"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                />
                <input
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: Number(e.target.value) })}
                  placeholder="Tamanho"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                />
                <input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Cor"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                />
                <input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Localização"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                />
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  placeholder="Estoque"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryItem["status"] })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                >
                  <option>Disponível</option>
                  <option>Costureira</option>
                  <option>Alugado</option>
                  <option>Lavanderia</option>
                </select>
                <select
                  value={formData.priceCategory}
                  onChange={(e) => {
                    const selected = priceOptions.find((option) => option.label === e.target.value);
                    setFormData({
                      ...formData,
                      priceCategory: e.target.value,
                      price: selected?.price ?? formData.price,
                    });
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                >
                  {priceOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label} - R$ {option.price.toFixed(2)}
                    </option>
                  ))}
                </select>
                <div className="lg:col-span-2 grid gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#17182b]">Imagem do traje</p>
                      <p className="mt-1 text-sm text-slate-500">Envie uma foto para substituir a imagem padrão do card.</p>
                    </div>
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <Image src={formData.image} alt="Prévia da imagem do traje" width={80} height={80} className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#17182b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-900"
                  />
                  <input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="URL da imagem ou deixe a foto enviada acima"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                  />
                </div>
                <div className="text-sm text-slate-500 mt-2">Preço associado: R$ {formData.price.toFixed(2)}</div>
                <div className="lg:col-span-2 flex items-center gap-3">
                  <button type="submit" className="rounded-2xl bg-[#17182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">Salvar traje</button>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-700 transition hover:bg-slate-100">Cancelar</button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-200 mb-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <nav className="flex flex-wrap gap-3">
                {statusTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? "bg-[#17182b] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>

              <div className="w-full xl:max-w-md">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por ID ou nome"
                  className="w-full border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                />
              </div>
            </div>
          </div>

          <section>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array(4)
                  .fill(null)
                  .map((_, idx) => (
                    <div key={idx} className="h-[36rem] rounded-[28px] bg-slate-100" />
                  ))}
              </div>
            ) : mergedItems.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-8 py-12 text-center text-slate-500 shadow-sm">
                <p className="text-xl font-semibold">Nenhum traje encontrado.</p>
                <p className="mt-2 text-sm">Adicione um traje para começar a preencher seu inventário.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {mergedItems.map((item) => (
                  <Card key={item.id} item={item} onAction={handleItemAction} />
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-500">Mostrando {mergedItems.length} itens</p>
              <div className="flex items-center gap-2">
                <button className="p-2">◀</button>
                <div className="flex gap-1">
                  <button className="w-8 h-8 bg-white rounded border">1</button>
                  <button className="w-8 h-8 rounded border">2</button>
                  <button className="w-8 h-8 rounded border">3</button>
                </div>
                <button className="p-2">▶</button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {reservationItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Nova reserva</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#17182b]">{reservationItem.title}</h3>
              </div>
              <button onClick={() => setReservationItem(null)} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Nome do cliente
                <input
                  value={reservationForm.clientName}
                  onChange={(e) => setReservationForm({ ...reservationForm, clientName: e.target.value })}
                  required
                  maxLength={64}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                  placeholder="Ex.: João da Silva"
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                WhatsApp / telefone
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={reservationForm.clientPhone}
                  onChange={(e) => setReservationForm({ ...reservationForm, clientPhone: formatPhoneInput(e.target.value) })}
                  required
                  pattern="\(\d{2}\)\s\d{5}-\d{4}"
                  maxLength={15}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                  placeholder="(11) 99999-9999"
                />
              </label>
              <label className="block text-sm font-medium text-slate-600 sm:col-span-2">
                E-mail
                <input
                  type="email"
                  autoComplete="email"
                  value={reservationForm.clientEmail}
                  onChange={(e) => setReservationForm({ ...reservationForm, clientEmail: e.target.value })}
                  required
                  maxLength={70}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                  placeholder="cliente@email.com"
                />
              </label>
              <label className="block text-sm font-medium text-slate-600 sm:col-span-2">
                Valor de entrada
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="1"
                  value={reservationForm.entryAmount}
                  onChange={(e) => setReservationForm({ ...reservationForm, entryAmount: Number(e.target.value) })}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                  placeholder="50 a 100"
                />
              </label>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={sendToCostureira}
                  onChange={(e) => setSendToCostureira(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#17182b]"
                />
                <span className="font-semibold">Enviar ajuste para costureira</span>
              </label>

              {sendToCostureira ? (
                <div className="mt-4 grid gap-4">
                  <label className="block text-sm font-medium text-slate-600">
                    Costureira responsável
                    <select
                      value={assignedTailorId}
                      onChange={(e) => setAssignedTailorId(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                    >
                      {costureiras.length > 0 ? (
                        costureiras.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))
                      ) : (
                        <option value="">Nenhuma costureira cadastrada</option>
                      )}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-slate-600">
                    Tipo de ajuste
                    <input
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value)}
                      placeholder="Ex.: barra, cintura, ombro"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-600">
                    Observação de ajuste
                    <textarea
                      value={adjustmentDescription}
                      onChange={(e) => setAdjustmentDescription(e.target.value)}
                      placeholder="Descreva o ajuste desejado"
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-600">
                    Medidas
                    <textarea
                      value={adjustmentMeasurements}
                      onChange={(e) => setAdjustmentMeasurements(e.target.value)}
                      placeholder="Medidas do cliente (ex.: cintura, quadril, ombro, etc.)"
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-[#17182b] focus:ring-2 focus:ring-[#17182b]/20"
                    />
                  </label>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Marque esta opção para enviar o traje à costureira com um pedido de ajuste.</p>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-[#17182b]">Plano selecionado</p>
              <p className="mt-2">{reservationPlan} • Valor estimado: R$ {((reservationItem?.price ?? 0) * (reservationPlan === "Semanal" ? 7 * 0.7 : 1)).toFixed(2)}</p>
            </div>

            <div className="sticky bottom-0 mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white pt-4 sm:flex-row sm:justify-end">
              <button onClick={() => setReservationItem(null)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancelar</button>
              <button onClick={confirmReservation} className="rounded-2xl bg-[#17182b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">Confirmar reserva</button>
            </div>
          </div>
        </div>
        )}

        {viewedItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Detalhes do pedido</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#17182b]">{viewedItem.title}</h3>
                </div>
                <button onClick={() => { setViewedItem(null); setViewedPayment(null); }} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">
                  <FiX className="text-lg" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">ID do traje</p>
                  <p className="font-semibold text-[#17182b]">{viewedItem.id}</p>
                </div>
                {viewedPayment ? (
                  <>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Cliente</p>
                      <p className="font-semibold text-[#17182b]">{viewedPayment.clientName || "Não informado"}</p>
                      <p className="mt-1 text-sm text-slate-600">{viewedPayment.clientPhone || "-"}</p>
                      <p className="mt-1 text-sm text-slate-600">{viewedPayment.clientEmail || "-"}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Valor total do traje</p>
                      <p className="font-semibold text-[#17182b]">R$ {viewedPayment.amount.toFixed(2)}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Entrada dada</p>
                      <p className="font-semibold text-[#17182b]">R$ {(viewedPayment.entryAmount ?? 0).toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl bg-slate-50 p-4 text-slate-500">Nenhum pagamento encontrado para este pedido.</div>
                )}
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-semibold text-[#17182b]">{viewedItem.status}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Localização atual</p>
                  <p className="font-semibold text-[#17182b]">{viewedItem.location}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AuthGuard>
    );
}
