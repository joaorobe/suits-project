"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasAuthCookie = document.cookie
      .split(";")
      .map((item) => item.trim())
      .some((item) => item.startsWith("suits-auth-user="));
    const hasStoredUser = Boolean(window.localStorage.getItem("suits-auth-user"));
    if (hasAuthCookie || hasStoredUser) {
      const storedUser = window.localStorage.getItem("suits-auth-user");
      try {
        const user = JSON.parse(storedUser || "{}");
        const redirectPath = user.role === "costureira" ? "/costureira" : "/dashboard";
        router.replace(redirectPath);
      } catch {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  function formatCpf(value: string) {
    const onlyDigits = value.replace(/\D/g, "").slice(0, 11);
    const parts = [] as string[];
    if (onlyDigits.length > 3) {
      parts.push(onlyDigits.slice(0, 3));
      if (onlyDigits.length > 6) {
        parts.push(onlyDigits.slice(3, 6));
        if (onlyDigits.length > 9) {
          parts.push(onlyDigits.slice(6, 9));
          parts.push(onlyDigits.slice(9, 11));
        } else {
          parts.push(onlyDigits.slice(6));
        }
      } else {
        parts.push(onlyDigits.slice(3));
      }
    } else {
      parts.push(onlyDigits);
    }

    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
    if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`;
    if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
    return parts[0] || "";
  }

  function handleCpfChange(value: string) {
    setCpf(formatCpf(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf, password, remember }),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.message || "Falha ao autenticar.");
      return;
    }

    if (typeof window !== "undefined" && data.user?.name) {
      const userPayload = JSON.stringify(data.user);
      localStorage.setItem("suits-auth-user", userPayload);
      document.cookie = `suits-auth-user=${encodeURIComponent(userPayload)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      
      const redirectPath = data.user.role === "costureira" ? "/costureira" : "/dashboard";
      router.push(redirectPath);
    }
  }

  return (
    <div className="min-h-screen bg-[#17182b] flex flex-col items-center justify-center px-6 py-10 text-white">
      <header className="relative z-10 mb-10 text-center">
        <div className="mx-auto mb-6 h-auto w-full max-w-sm">
          <Image src="/logo.png" alt="Suits" width={220} height={60} className="mx-auto object-contain" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Bem-vindo ao Suits</h1>
          <p className="text-sm text-slate-300">Entre com seu CPF para acessar o painel e gerenciar suas operações.</p>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#141a2c]/90 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
          <div className="bg-gradient-to-r from-blue-700 via-slate-900 to-[#17182b] px-8 py-8 text-center text-white">
            <h2 className="text-2xl font-semibold">Login</h2>
            <p className="mt-2 text-sm text-slate-200/80">Segurança e praticidade em um só lugar.</p>
          </div>

          <form className="space-y-5 px-8 py-8 bg-[#101523]" onSubmit={handleSubmit}>
            {error ? <div className="rounded-2xl bg-red-600/10 border border-red-500/20 p-3 text-sm text-red-200">{error}</div> : null}
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">CPF</label>
              <input
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner shadow-black/10 outline-none transition duration-200 focus:border-blue-400 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <span>Senha</span>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-slate-300 transition hover:text-blue-300"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner shadow-black/10 outline-none transition duration-200 focus:border-blue-400 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-300">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-blue-400"
                />
                <span>Lembrar-me</span>
              </label>
              <Link href="#" className="text-blue-300 transition hover:text-blue-100">
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

