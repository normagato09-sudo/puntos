"use client";

import { useState, useTransition } from "react";
import { cancelRedeem, confirmRedeem } from "@/app/actions";
import { CheckIcon } from "@/components/icons";

/**
 * Confirmar la entrega de un regalo (resta los puntos).
 * `direct`: el hijo aún no ha pulsado "Canjear", pero los padres lo entregan igualmente.
 */
export function RedeemActions({ rewardId, direct }: { rewardId: number; direct?: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [sure, setSure] = useState(false);

  if (direct && !sure) {
    return (
      <button
        type="button"
        onClick={() => setSure(true)}
        className="mt-3 h-11 rounded-xl border-2 border-brand-line text-sm font-extrabold text-brand-dark"
      >
        Entregar ahora
      </button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            direct
              ? setSure(false)
              : start(async () => {
                  await cancelRedeem(rewardId);
                })
          }
          className="h-12 flex-1 rounded-2xl border-2 border-line-strong bg-white text-sm font-extrabold disabled:opacity-60"
        >
          {direct ? "Cancelar" : "Todavía no"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await confirmRedeem(rewardId);
              setError(res.error ?? "");
            })
          }
          className="flex h-12 flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-brand text-sm font-extrabold text-white disabled:opacity-60"
        >
          <CheckIcon size={18} />
          Entregado · restar puntos
        </button>
      </div>
      {error && <p className="text-sm font-bold text-no">{error}</p>}
    </div>
  );
}
