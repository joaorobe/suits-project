"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import AuthGuard from "../components/AuthGuard";
import Sidebar from "../components/Sidebar";
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY, type AppTheme } from "../theme-provider";

const themeOptions: Array<{
  value: AppTheme;
  label: string;
  icon: ReactNode;
}> = [
  { value: "light", label: "Claro", icon: <FiSun className="text-lg" /> },
  { value: "dark", label: "Escuro", icon: <FiMoon className="text-lg" /> },
];

export default function SettingsPage() {
  const [theme, setTheme] = useState<AppTheme>("light");

  useEffect(() => {
    const id = window.setTimeout(() => setTheme(getStoredTheme()), 0);
    return () => window.clearTimeout(id);
  }, []);

  function handleThemeChange(nextTheme: AppTheme) {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen overflow-hidden bg-[#F3F5F8] font-sans">
        <Sidebar active="Configurações" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <header className="mb-8 rounded-[32px] bg-[#17182b] p-8 text-white shadow-[0_30px_90px_rgba(23,24,43,0.14)]">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Geral</p>
            <h1 className="mt-2 text-4xl font-serif font-semibold">Configurações</h1>
          </header>

          <section className="max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#17182b]">Tema da página</h2>
                <p className="mt-1 text-sm text-slate-500">Escolha como o sistema aparece neste dispositivo.</p>
              </div>

              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
                {themeOptions.map((option) => {
                  const selected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleThemeChange(option.value)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        selected ? "bg-[#17182b] text-white shadow-sm" : "text-slate-600 hover:bg-white"
                      }`}
                      aria-pressed={selected}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
