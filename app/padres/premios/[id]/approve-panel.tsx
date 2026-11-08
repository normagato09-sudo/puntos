"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSync } from "@/components/sync-provider";
import { hardNavigate } from "@/lib/offline/hooks";
import { CheckIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { PRICE_SHORTCUTS } from "@/lib/constants";

export function ApprovePanel({
  rewardId,
  rewardName,
  childId,
  initial,
  points,
}: {
  rewardId: number;
  rewardName: string;
  childId: number;
  initial: number;
  points: number;
}) {
  const router = useRouter();
  const { submit } = useSync();
  const [price, setPrice] = useState(Math.max(1, initial));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function decide(decision: "approve" | "reject") {
    setPending(true);
    setError("");
    const r = await submit({
      type: "parent.reward",
      childId,
      rewardId,
      rewardName,
      decision,
      price: decision === "approve" ? price : null,
    });
    setPending(false);
    if (r.error) return setError(r.error);
    const dest = `/padres/premios?hijo=${childId}`;
    if (navigator.onLine) router.push(dest);
    else hardNavigate(dest);
  }
  const set = (v: number) => setPrice(Math.max(1, Math.min(10000, v)));
  const missing = Math.max(0, price - points);

  const step =
    "flex h-13 w-13 items-center justify-center rounded-2xl bg-plum text-white active:bg-night-line disabled:opacity-40";

  return (
    <>
      <div className="flex flex-col gap-3.5 rounded-[20px] bg-ink p-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold">Precio real (ajústalo si hace falta)</span>
          <span className="rounded-full bg-plum px-2.5 py-1 text-xs font-extrabold whitespace-nowrap">1 punto = 1 €</span>
        </div>
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Quitar 1 euro" onClick={() => set(price - 1)} disabled={price <= 1} className={step}>
            <MinusIcon size={22} strokeWidth={2.6} />
          </button>
          <div className="flex flex-col items-center gap-1">
            <label htmlFor="precio-real" className="sr-only">
              Precio real en euros
            </label>
            <div className="flex items-baseline">
              <input
                id="precio-real"
                inputMode="numeric"
                value={price}
                onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")) || 1)}
                className="w-[3.2ch] bg-transparent text-right font-display text-[52px] leading-none font-semibold text-white focus:outline-none"
                style={{ width: `${String(price).length + 0.2}ch` }}
              />
              <span className="ml-2 font-display text-[52px] leading-none font-semibold">€</span>
            </div>
            <span className="text-[15px] font-extrabold text-sun">
              = {price} {price === 1 ? "punto" : "puntos"}
            </span>
          </div>
          <button type="button" aria-label="Añadir 1 euro" onClick={() => set(price + 1)} className={step}>
            <PlusIcon size={22} strokeWidth={2.6} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PRICE_SHORTCUTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => set(v)}
              aria-pressed={price === v}
              className={`h-11 rounded-xl text-sm font-extrabold ${
                price === v ? "bg-sun text-ink" : "bg-plum text-white"
              }`}
            >
              {v} €
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-sun-line bg-sun-chip px-3.5 py-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-sun font-display text-lg font-semibold">
          {price}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-extrabold">Saldrá en la casilla {price} de su tabla</span>
          <span className="text-xs font-bold text-muted">
            Tiene {points} {points === 1 ? "punto" : "puntos"}
            {missing > 0 ? `: le faltan ${missing}` : ": ya lo puede canjear"}
          </span>
        </div>
      </div>

      {error && <p className="text-sm font-bold text-no">{error}</p>}
      <div className="mt-2 flex gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("reject")}
          className="h-14 flex-1 rounded-2xl border-2 border-line-strong bg-white text-[15px] font-extrabold disabled:opacity-60"
        >
          Ahora no
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("approve")}
          className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-brand text-base font-extrabold text-white disabled:opacity-60"
        >
          <CheckIcon size={20} />
          {pending ? "Guardando…" : "Aprobar"}
        </button>
      </div>
    </>
  );
}
