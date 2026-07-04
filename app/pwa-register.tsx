"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALL_DISMISSED_KEY = "suits-pwa-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(navigatorWithStandalone.standalone);
}

function isIos() {
  if (typeof window === "undefined") return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        registration.update();
      } catch (error) {
        console.warn("Falha ao registrar o PWA", error);
      }
    };

    register();
  }, []);

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "true") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowIosHint(false);
      setIsVisible(false);
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isIos()) {
      window.setTimeout(() => {
        setShowIosHint(true);
        setIsVisible(true);
      }, 0);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;

    setIsInstalling(true);
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setIsInstalling(false);

    if (choice.outcome === "accepted") {
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    }

    setInstallPrompt(null);
    setIsVisible(false);
  }

  function handleDismiss() {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setInstallPrompt(null);
    setShowIosHint(false);
    setIsVisible(false);
  }

  if (!isVisible || (!installPrompt && !showIosHint)) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl border border-white/15 bg-[#17182b] p-4 text-white shadow-2xl md:bottom-6">
      <div className="flex items-start gap-3">
        <Image src="/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl bg-white" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instalar Suits</p>
          <p className="mt-1 text-xs leading-5 text-slate-200">
            {installPrompt
              ? "Abra como app no celular para acessar medidas e pedidos mais rápido."
              : "No iPhone, toque em Compartilhar e Adicionar à Tela de Início."}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {installPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#17182b] transition hover:bg-slate-100 disabled:opacity-70"
          >
            {isInstalling ? "Abrindo..." : "Instalar"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
