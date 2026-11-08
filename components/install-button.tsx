"use client";

import { useEffect, useState } from "react";
import { XIcon } from "./icons";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window {
    __puntosInstall?: InstallEvent | null;
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
);

/**
 * "Instalar app": en Android/Chrome instala con un toque; en iPhone explica cómo
 * añadirla a la pantalla de inicio. No aparece si la app ya está instalada.
 */
export function InstallButton({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios">("hidden");
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const update = () => {
      if (isStandalone()) setMode("hidden");
      else if (window.__puntosInstall) setMode("prompt");
      else if (isIOS()) setMode("ios");
      else setMode("hidden");
    };
    update();
    const mq = window.matchMedia("(display-mode: standalone)");
    window.addEventListener("puntos-installable", update);
    window.addEventListener("puntos-installed", update);
    mq.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("puntos-installable", update);
      window.removeEventListener("puntos-installed", update);
      mq.removeEventListener?.("change", update);
    };
  }, []);

  if (mode === "hidden") return null;

  const cls =
    tone === "dark"
      ? "bg-sun text-ink"
      : "bg-brand text-white";

  async function install() {
    if (mode === "ios") return setHelp(true);
    const e = window.__puntosInstall;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    window.__puntosInstall = null;
    setMode(outcome === "accepted" ? "hidden" : isIOS() ? "ios" : "hidden");
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold ${cls}`}
      >
        <DownloadIcon />
        Instalar app
      </button>
      {help && <IOSHelp onClose={() => setHelp(false)} />}
    </>
  );
}

function IOSHelp({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-[28px] bg-white px-6 pt-5 pb-[calc(24px+env(safe-area-inset-bottom))] text-ink sm:rounded-[28px] sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="ios-title" className="font-display text-2xl font-semibold">
            Instalar en el iPhone
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted"
          >
            <XIcon size={22} />
          </button>
        </div>
        <ol className="mt-4 flex flex-col gap-3">
          <li className="flex items-center gap-3.5 rounded-2xl border border-line p-3">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand-soft text-brand">
              {/* Icono de Compartir de Safari */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12M8 7l4-4 4 4" />
                <path d="M8 11H6a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1v-8a1 1 0 00-1-1h-2" />
              </svg>
            </span>
            <span className="text-[15px] font-bold">
              <span className="text-muted">1.</span> Pulsa <b className="font-extrabold">Compartir</b> en la barra de Safari
            </span>
          </li>
          <li className="flex items-center gap-3.5 rounded-2xl border border-line p-3">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand-soft text-brand">
              {/* Icono de Añadir a pantalla de inicio */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <path d="M12 8.5v7M8.5 12h7" />
              </svg>
            </span>
            <span className="text-[15px] font-bold">
              <span className="text-muted">2.</span> Elige <b className="font-extrabold">Añadir a pantalla de inicio</b>
            </span>
          </li>
          <li className="flex items-center gap-3.5 rounded-2xl border border-line p-3">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand text-[11px] font-extrabold text-white">
              Añadir
            </span>
            <span className="text-[15px] font-bold">
              <span className="text-muted">3.</span> Pulsa <b className="font-extrabold">Añadir</b> arriba a la derecha
            </span>
          </li>
        </ol>
        <p className="mt-4 text-[13px] font-semibold text-muted">
          Aparecerá el icono de Puntos en la pantalla de inicio. La primera vez que la abras te pedirá el código
          familiar una sola vez.
        </p>
      </div>
    </div>
  );
}
