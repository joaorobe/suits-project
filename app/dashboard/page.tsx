"use client";

import React, { useEffect, useState } from "react";
import { FiBriefcase, FiTrendingUp, FiBell, FiClock } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";
import type { DashboardActivity, DashboardMetric, DashboardOverview } from "../../lib/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [overview, setOverview] = useState<DashboardOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      setMetrics(data.metrics ?? []);
      setActivities(data.activities ?? []);
      setOverview(data.overview ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AuthGuard>
      <div className="flex min-h-screen overflow-hidden bg-[#F3F5F8] font-sans">
        <Sidebar active="Dashboard" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <header className="mb-8 rounded-[32px] bg-[#17182b] p-8 shadow-[0_30px_90px_rgba(23,24,43,0.14)] text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Painel</p>
              <h1 className="mt-2 text-4xl font-serif font-semibold">Visão geral do Suits</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200">Acompanhe estoque, devoluções e demandas de costura com métricas atualizadas e foco operacional.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#17182b] shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition hover:bg-slate-100">
                <FiBell className="mr-2 text-lg" /> Notificações
              </button>
              <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/20">
                <FiClock className="mr-2 text-lg" /> Atualizar
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-4 mb-8">
          {loading ? (
            Array(4).fill(null).map((_, index) => (
              <div key={index} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
                <div className="h-6 w-24 rounded bg-slate-200" />
                <div className="mt-6 h-12 w-32 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-20 rounded bg-slate-200" />
              </div>
            ))
          ) : metrics.length === 0 ? (
            <div className="col-span-1 xl:col-span-4 rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Nenhuma métrica disponível no momento.
            </div>
          ) : (
            metrics.map((card, index) => (
              <div key={`${card.label}-${index}`} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500 uppercase tracking-[0.18em]">{card.label}</div>
                    <div className="mt-4 text-4xl font-semibold text-[#17182b]">{card.value}</div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
                    <FiBriefcase className="text-2xl" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-500">{card.detail}</div>
              </div>
            ))
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-8">
          <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#17182b]">Resumo Operacional</h2>
                <p className="mt-2 text-sm text-slate-500">Principais indicadores para resultados e fluxo de processos.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                <FiTrendingUp className="text-base" /> Últimas 24h
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array(3).fill(null).map((_, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                    <div className="mt-4 h-10 w-16 rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-20 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : overview.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                Nenhum resumo operacional disponível.
              </div>
            ) : (
              <div className="grid gap-4">
                {overview.map((item, index) => (
                  <div key={`${item.title}-${item.value}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-sm text-slate-500">{item.title}</div>
                    <div className="mt-4 text-3xl font-semibold text-[#17182b]">{item.value}</div>
                    <div className={`mt-2 text-sm ${item.color}`}>{item.change}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-2 rounded-[32px] bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#17182b]">Atividades Recentes</h2>
                <p className="mt-2 text-sm text-slate-500">Logs reais de reservas, pagamentos, devoluções e lavanderia.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-600">Topo</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {loading ? (
                Array(6).fill(null).map((_, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="h-5 w-32 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-full rounded bg-slate-200" />
                    <div className="mt-4 h-3 w-24 rounded bg-slate-200" />
                  </div>
                ))
              ) : activities.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  Nenhuma atividade disponível no momento.
                </div>
              ) : (
                activities.map((item, index) => (
                  <div key={`${item.title}-${item.description}-${item.time}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[#17182b]">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                      </div>
                      <div className="text-xs text-slate-400">{item.time}</div>
                    </div>
                    <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#17182b]">{item.badge}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        </main>
      </div>
    </AuthGuard>
  );
}
