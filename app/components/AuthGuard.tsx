"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const PROTECTED_PREFIXES = ["/dashboard", "/inventory", "/costureira", "/costureira-admin", "/devolucao", "/pagamentos", "/settings"];
const ADMIN_ONLY_PREFIXES = ["/dashboard", "/inventory", "/costureira-admin", "/devolucao", "/pagamentos"];
const TAILOR_ONLY_PREFIXES = ["/costureira"];

function getStoredUser() {
  if (typeof window === "undefined") return null;

  const cookieValue = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("suits-auth-user="));

  if (cookieValue) {
    try {
      const encoded = cookieValue.slice("suits-auth-user=".length);
      return JSON.parse(decodeURIComponent(encoded)) as Record<string, unknown>;
    } catch {
      // ignore malformed cookie
    }
  }

  const stored = window.localStorage.getItem("suits-auth-user");
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (!isProtected) return;

    const user = getStoredUser();
    if (!user || typeof user.role !== "string") {
      const redirectTo = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectTo);
      return;
    }

    if (TAILOR_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      if (user.role !== "costureira") {
        router.replace("/dashboard");
      }
      return;
    }

    if (ADMIN_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      if (user.role !== "admin") {
        router.replace("/costureira");
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
}
