"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiBarChart,
  FiBriefcase,
  FiCreditCard,
  FiLogOut,
  FiMenu,
  FiRotateCcw,
  FiScissors,
  FiSettings,
  FiX,
} from "react-icons/fi";

export default function Sidebar({ active }: { active?: string }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [userRole, setUserRole] = useState<"admin" | "costureira">("admin");

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readStoredUser = () => {
      const cookieValue = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("suits-auth-user="));

      if (cookieValue) {
        try {
          const encoded = cookieValue.slice("suits-auth-user=".length);
          const parsed = JSON.parse(decodeURIComponent(encoded)) as Record<string, unknown>;
          const directName = typeof parsed.name === "string" ? parsed.name : undefined;
          const nestedName =
            typeof parsed.user === "object" &&
            parsed.user &&
            typeof (parsed.user as Record<string, unknown>).name === "string"
              ? (parsed.user as Record<string, unknown>).name
              : undefined;
          const fallbackName = typeof parsed.fullName === "string" ? parsed.fullName : undefined;
          const name = directName || nestedName || fallbackName;

          if (typeof name === "string" && name.trim()) {
            setUserName(name);
          }

          const role = typeof parsed.role === "string" ? parsed.role : "admin";
          setUserRole(role === "costureira" ? "costureira" : "admin");
          return;
        } catch {
          // fallback to localStorage below
        }
      }

      const candidates = ["suits-auth-user", "suits-user", "suits-user-info"];
      for (const key of candidates) {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;

        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const directName = typeof parsed.name === "string" ? parsed.name : undefined;
          const nestedName =
            typeof parsed.user === "object" &&
            parsed.user &&
            typeof (parsed.user as Record<string, unknown>).name === "string"
              ? (parsed.user as Record<string, unknown>).name
              : undefined;
          const fallbackName = typeof parsed.fullName === "string" ? parsed.fullName : undefined;
          const name = directName || nestedName || fallbackName;

          if (typeof name === "string" && name.trim()) {
            setUserName(name);
          }

          const role = typeof parsed.role === "string" ? parsed.role : "admin";
          setUserRole(role === "costureira" ? "costureira" : "admin");
          return;
        } catch {
          if (raw.trim()) {
            setUserName(raw);
            return;
          }
        }
      }

      setUserName("Usuário");
    };

    readStoredUser();
    window.addEventListener("storage", readStoredUser);
    return () => window.removeEventListener("storage", readStoredUser);
  }, []);

  const items: { label: string; href: string; icon: React.ReactNode }[] =
    userRole === "costureira"
      ? [
          {
            label: "Costureira",
            href: "/costureira",
            icon: <FiScissors className="text-2xl text-[var(--suit-gold)]" />,
          },
        ]
      : [
          {
            label: "Dashboard",
            href: "/dashboard",
            icon: <FiBarChart className="text-2xl text-[var(--suit-gold)]" />,
          },
          {
            label: "Inventário",
            href: "/inventory",
            icon: <FiBriefcase className="text-2xl text-[var(--suit-gold)]" />,
          },
          {
            label: "Costureira",
            href: "/costureira-admin",
            icon: <FiScissors className="text-2xl text-[var(--suit-gold)]" />,
          },
          {
            label: "Devolução",
            href: "/devolucao",
            icon: <FiRotateCcw className="text-2xl text-[var(--suit-gold)]" />,
          },
          {
            label: "Pagamentos",
            href: "/pagamentos",
            icon: <FiCreditCard className="text-2xl text-[var(--suit-gold)]" />,
          },
        ];

  const resolvedActive = active || (mounted ? items.find((it) => pathname.startsWith(it.href))?.label : undefined) || "Inventário";
  const isSettingsActive = Boolean(active?.startsWith("Configura")) || (mounted && pathname.startsWith("/settings"));
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "U";

  function handleLogout() {
    if (typeof window !== "undefined") {
      ["suits-auth-user", "suits-user", "suits-user-info"].forEach((key) => {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      });

      document.cookie = "suits-auth-user=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "suits-auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }

    setOpen(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#17182b]/90 text-white shadow-lg backdrop-blur-md md:hidden"
      >
        <FiMenu className="text-2xl" />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed bottom-4 left-4 top-4 z-50 w-[calc(100%-2rem)] max-w-[18rem] transform overflow-hidden rounded-3xl border border-white/80 bg-[var(--suit-muted)] text-gray-700 shadow-[0_24px_70px_rgba(15,23,42,0.22)] transition-transform duration-300 md:w-72 md:max-w-none md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-[calc(100%+2rem)]"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-24 shrink-0 items-center justify-center bg-[#17182b] p-6">
            <Link href="/" className="flex w-full items-center justify-center">
              <Image src="/logo.png" alt="Suits" width={180} height={83} className="h-auto w-auto object-contain" />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:hidden"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <p className="mb-4 text-sm font-semibold uppercase text-gray-700">Menu</p>
            <ul className="space-y-3">
              {items.map((it) => {
                const isActive = resolvedActive === it.label;
                return (
                  <li key={it.label}>
                    <Link
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                        isActive ? "bg-[#17182b] text-white shadow-sm" : "text-base text-gray-700 hover:bg-white/60"
                      }`}
                    >
                      {it.icon}
                      <span className="text-base font-medium">{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 text-sm text-gray-600">
              <p className="mb-2 font-semibold text-gray-700">Geral</p>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
                  isSettingsActive ? "bg-[#17182b] text-white shadow-sm" : "text-gray-700 hover:bg-white/60"
                }`}
              >
                <FiSettings className="text-[var(--suit-gold)]" />
                Configurações
              </Link>
            </div>
          </div>

          <div className="shrink-0 bg-gradient-to-t from-[var(--suit-muted)] via-[var(--suit-muted)] to-transparent px-4 pb-5 pt-4">
            <div className="rounded-2xl border border-white/80 bg-[#17182b] p-3 text-white shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--suit-gold)] text-base font-semibold text-[#17182b]">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{userName}</p>
                  <p className="text-xs text-slate-300">{userRole === "costureira" ? "Costureira" : "Administrador"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[var(--suit-gold)]/60"
              >
                <FiLogOut className="text-base text-[var(--suit-gold)]" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="hidden w-80 flex-shrink-0 md:block" aria-hidden="true" />
    </>
  );
}
