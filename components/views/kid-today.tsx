"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { CheckIcon, ClockIcon, StarIcon } from "@/components/icons";
import { useSync } from "@/components/sync-provider";
import { DAY_NAMES, weekdayIndex } from "@/lib/dates";
import { useToday } from "@/lib/offline/hooks";
import { effectiveStatus } from "@/lib/offline/types";
import { pickGoal, plural, snapKey, useSaveSnapshot, type KidTodayData } from "./snapshot";

export function KidToday({ data, fromServer = true }: { data: KidTodayData; fromServer?: boolean }) {
  useSaveSnapshot(snapKey.kidToday(data.childId), data, fromServer);
  const { ops, submit } = useSync();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  // "Hoy" se calcula en el dispositivo: si la pantalla viene de la caché de otro día,
  // se muestran las tareas de hoy sin los estados antiguos.
  const today = useToday(data.day);
  const sameDay = today === data.day;
  const list = data.tasks
    .filter((t) => t.days[weekdayIndex(today)] === "1")
    .map((t) => ({
      ...t,
      status: effectiveStatus(sameDay ? (data.logs[`${t.id}|${today}`] ?? null) : null, t.id, today, ops),
    }));

  const g = pickGoal(data.goals, data.points);
  const price = g?.goal.price ?? 0;
  const left = price - data.points;

  async function markDone(taskId: number) {
    setBusy(taskId);
    setError("");
    const r = await submit({ type: "kid.done", childId: data.childId, taskId, date: today });
    if (r.error) setError(r.error);
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <Avatar color={data.color} seed={data.childId} size={52} radius={14} />
        <h1 className="font-display text-[28px] leading-tight font-semibold">¡Hola, {data.name}!</h1>
      </div>

      <div className="flex flex-col gap-3 rounded-[22px] bg-sun px-5 py-[18px]">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[52px] leading-none font-semibold">{data.points}</span>
            <span className="text-base font-extrabold">{data.points === 1 ? "punto" : "puntos"}</span>
          </div>
          <StarIcon filled size={40} className="text-ink" />
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-white px-3.5 py-3">
          {g ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-bold text-muted">Mi meta</span>
                <span className="text-[13px] font-extrabold">
                  {Math.min(data.points, price)} / {price}
                </span>
              </div>
              <span className="font-display text-[19px] font-semibold">{g.goal.name}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-track">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.min(100, (data.points / Math.max(price, 1)) * 100)}%` }}
                />
              </div>
              <span className="text-[13px] font-extrabold text-brand-dark">
                {g.reached ? "¡Ya lo puedes canjear!" : `¡Solo te faltan ${plural(left, "punto", "puntos")}!`}
              </span>
            </>
          ) : (
            <>
              <span className="text-[13px] font-bold text-muted">Mi meta</span>
              <span className="text-sm font-bold">Todavía no tienes ningún premio aprobado.</span>
              <Link
                href={`/hijo/${data.childId}/premios/nuevo`}
                className="text-[13px] font-extrabold text-brand-dark underline"
              >
                Pedir un premio
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-1 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">Hoy · {DAY_NAMES[weekdayIndex(today)].toLowerCase()}</h2>
        <span className="text-right text-xs font-bold text-muted">Márcalas y tus padres confirman</span>
      </div>

      {error && <p className="text-sm font-bold text-no">{error}</p>}

      {list.length === 0 && (
        <p className="rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-muted">
          Hoy no tienes tareas. ¡Día libre!
        </p>
      )}

      {list.map((t) => {
        const ok = t.status === "done";
        const wait = t.status === "waiting";
        const missed = t.status === "missed";
        return (
          <div
            key={t.id}
            className={`flex min-h-16 items-center gap-3 rounded-2xl border py-2.5 pr-2.5 pl-3 transition-colors ${
              wait ? "border-sun-line bg-sun-soft" : "border-line bg-white"
            }`}
          >
            <div
              className={`flex h-8 w-8 flex-none items-center justify-center rounded-[10px] ${
                ok ? "bg-brand text-white" : wait ? "bg-sun text-ink" : "border-2 border-line-strong bg-white"
              }`}
            >
              {ok && <CheckIcon size={18} strokeWidth={2.8} />}
              {wait && <ClockIcon size={18} strokeWidth={2.4} />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold">{t.name}</span>
              <span
                className={`text-xs font-extrabold ${ok ? "text-brand-dark" : wait ? "text-sun-ink" : "text-muted"}`}
              >
                {ok ? "+1 punto · ¡confirmada!" : wait ? "Esperando a tus padres" : missed ? "Hoy no ha sumado" : "+1 punto"}
              </span>
            </div>
            {!t.status && (
              <button
                type="button"
                disabled={busy === t.id}
                onClick={() => markDone(t.id)}
                className="h-11 rounded-xl bg-brand px-3.5 text-sm font-extrabold text-white disabled:opacity-60"
              >
                ¡Hecho!
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
