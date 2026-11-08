"use client";

import { useEffect, useState, useTransition } from "react";
// useEffect se usa para el teclado físico (ordenador).
import { enterParent } from "@/app/actions";
import { BackspaceIcon, LockIcon, XIcon } from "./icons";

/** Teclado de PIN de 4 dígitos para el perfil "Padres". */
export function PinPad({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  function press(d: string) {
    if (pending || pin.length >= 4) return;
    setError(false);
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      start(async () => {
        const res = await enterParent(next);
        if (res.ok) onSuccess();
        else {
          setError(true);
          setPin("");
        }
      });
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const key =
    "flex h-16 items-center justify-center rounded-2xl bg-night-2 font-display text-2xl font-semibold text-white active:bg-plum";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-title"
    >
      <div className="w-full max-w-sm rounded-t-[28px] bg-night px-6 pt-5 pb-[calc(24px+env(safe-area-inset-bottom))] text-white sm:rounded-[28px] sm:pb-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sun">
            <LockIcon size={20} strokeWidth={2.4} />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-night-text hover:text-white"
          >
            <XIcon size={22} />
          </button>
        </div>
        <h2 id="pin-title" className="mt-1 text-center font-display text-2xl font-semibold">
          PIN de padres
        </h2>
        <div className={`my-6 flex justify-center gap-4 ${error ? "animate-[shake_.3s]" : ""}`} aria-live="polite">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full ${i < pin.length ? "bg-sun" : "border-2 border-night-line"}`}
            />
          ))}
        </div>
        <p className="mb-4 h-5 text-center text-sm font-bold text-sun">
          {error ? "PIN incorrecto. Prueba otra vez." : pending ? "Comprobando…" : ""}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {keys.map((k) => (
            <button key={k} type="button" className={key} onClick={() => press(k)}>
              {k}
            </button>
          ))}
          <span />
          <button type="button" className={key} onClick={() => press("0")}>
            0
          </button>
          <button
            type="button"
            className={`${key} bg-transparent`}
            aria-label="Borrar"
            onClick={() => setPin((p) => p.slice(0, -1))}
          >
            <BackspaceIcon size={26} />
          </button>
        </div>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
    </div>
  );
}
