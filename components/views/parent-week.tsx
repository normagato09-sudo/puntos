"use client";

import Link from "next/link";
import { useState } from "react";
import { BackIcon, CheckIcon, ChevronRightIcon, StarIcon, XIcon } from "@/components/icons";
import { useSync } from "@/components/sync-provider";
import { DAY_KEYS, DAY_NAMES, addDays, mondayOf, shortDate, weekDates, weekLabel } from "@/lib/dates";
import { useToday } from "@/lib/offline/hooks";
import { effectiveStatus, type TaskState } from "@/lib/offline/types";
import { pickGoal, plural, snapKey, useSaveSnapshot, type ParentWeekData } from "./snapshot";

const BTN = "flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl px-2.5 text-[13px] font-extrabold box-border";

export function ParentWeek({
  data,
  header,
  fromServer = true,
}: {
  data: ParentWeekData;
  header?: React.ReactNode;
  fromServer?: boolean;
}) {
  useSaveSnapshot(snapKey.parentWeek(data.childId), data, fromServer);
  const { ops, submit } = useSync();
  const today = useToday(data.today);
  // Día elegido; vuelve al de los datos cuando llegan datos nuevos.
  const [picked, setPicked] = useState({ base: data.day, day: data.day });
  const day = picked.base === data.day ? picked.day : data.day;
  const [error, setError] = useState("");

  const dates = weekDates(data.monday);
  const status = (taskId: number, d: string): TaskState | null =>
    effectiveStatus(data.logs[`${taskId}|${d}`] ?? null, taskId, d, ops);
  const scheduled = (d: string) => data.tasks.filter((t) => t.days[(dates.indexOf(d) + 7) % 7] === "1");

  // Puntos: los del servidor más lo que cambian las confirmaciones aún sin enviar de esta semana.
  let delta = 0;
  for (const d of dates) {
    for (const t of data.tasks) {
      const before = data.logs[`${t.id}|${d}`] ?? null;
      const after = status(t.id, d);
      delta += (after === "done" ? 1 : 0) - (before === "done" ? 1 : 0);
    }
  }
  const points = data.points + delta;

  const g = pickGoal(data.goals, points);
  const ready = data.goals.filter((x) => !x.requested && x.price <= points).sort((a, b) => a.price - b.price);
  const goalText = !g
    ? "Aún no tiene ningún regalo aprobado"
    : g.reached
      ? `Ya puede canjear ${g.goal.name}`
      : `Faltan ${g.goal.price - points} para ${g.goal.name} (${g.goal.price})` +
        (ready.length ? ` · ya puede canjear ${ready.at(-1)!.name}` : "");

  const dayTasks = scheduled(day).map((t) => ({ ...t, status: status(t.id, day) }));
  const waiting = dayTasks.filter((t) => t.status === "waiting").length;
  const doneDay = dayTasks.filter((t) => t.status === "done").length;
  const isFuture = day > today;
  const weekHref = (d: string) => `/padres?hijo=${data.childId}&dia=${d}`;

  function pickDay(d: string) {
    setPicked({ base: data.day, day: d });
    window.history.replaceState(null, "", weekHref(d));
  }

  async function set(taskId: number, current: TaskState | null, target: "done" | "missed") {
    setError("");
    const r = await submit({
      type: "parent.task",
      childId: data.childId,
      taskId,
      date: day,
      status: current === target ? null : target,
    });
    if (r.error) setError(r.error);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {header}

        <div className="flex flex-col gap-3 rounded-[22px] bg-ink px-5 py-[18px] text-white">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl leading-none font-semibold text-sun">{points}</span>
              <span className="text-[15px] font-bold">{points === 1 ? "punto" : "puntos"}</span>
            </div>
            <StarIcon size={34} className="text-sun" />
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-plum">
            <div
              className="h-full rounded-full bg-sun"
              style={{ width: `${g ? Math.min(100, (points / Math.max(g.goal.price, 1)) * 100) : 0}%` }}
            />
          </div>
          <span className="text-[13px] font-semibold text-mist">{goalText}</span>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={weekHref(addDays(data.monday, -7))}
            aria-label="Semana anterior"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-ink"
          >
            <BackIcon size={20} />
          </Link>
          <span className="text-sm font-extrabold text-muted">
            {data.monday === mondayOf(today) ? "Esta semana" : weekLabel(data.monday)}
          </span>
          <Link
            href={weekHref(addDays(data.monday, 7))}
            aria-label="Semana siguiente"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-ink"
          >
            <ChevronRightIcon size={20} />
          </Link>
        </div>

        <div className="-mt-2 grid grid-cols-7 gap-1.5">
          {dates.map((d, i) => {
            const list = scheduled(d);
            const done = list.filter((t) => status(t.id, d) === "done").length;
            const wait = list.some((t) => status(t.id, d) === "waiting");
            const on = d === day;
            return (
              <button
                key={d}
                type="button"
                onClick={() => pickDay(d)}
                aria-label={`${DAY_NAMES[i]} ${shortDate(d)}: ${done} de ${list.length} hechas`}
                aria-pressed={on}
                className={`relative flex h-14 flex-col items-center justify-center gap-px rounded-[14px] border ${
                  on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
                } ${d > today && !on ? "opacity-60" : ""}`}
              >
                <span className="font-display text-[17px] font-semibold">{DAY_KEYS[i]}</span>
                <span className="text-[11px] font-bold">
                  {done}/{list.length}
                </span>
                {wait && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sun" />}
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-5 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">
            {DAY_NAMES[dates.indexOf(day)]} · {shortDate(day)}
          </h2>
          {waiting ? (
            <span className="rounded-full bg-sun px-2.5 py-1 text-[13px] font-extrabold text-ink">
              {waiting} por confirmar
            </span>
          ) : (
            <span className="text-[13px] font-bold text-muted">+{plural(doneDay, "pt", "pts")} este día</span>
          )}
        </div>

        {isFuture && <p className="text-[13px] font-semibold text-muted">Este día todavía no ha llegado.</p>}
        {error && <p className="text-sm font-bold text-no">{error}</p>}

        {dayTasks.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-muted">
            No hay tareas para este día.{" "}
            <Link href={`/padres/tareas?hijo=${data.childId}`} className="font-extrabold text-brand-dark underline">
              Configurar tareas
            </Link>
          </p>
        )}

        {dayTasks.map((t) => {
          const w = t.status === "waiting";
          return (
            <div
              key={t.id}
              className={`flex items-center gap-2 rounded-2xl border py-2.5 pr-2.5 pl-3.5 transition-colors ${
                w ? "border-sun-line bg-sun-soft" : "border-line bg-white"
              }`}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-bold">{t.name}</span>
                <span className={`text-xs font-extrabold ${w ? "text-sun-ink" : "text-muted"}`}>
                  {w
                    ? "Dice que la ha hecho · ¿confirmas?"
                    : t.status === "done"
                      ? "+1 punto · confirmada"
                      : t.status === "missed"
                        ? "No hecha"
                        : "1 punto"}
                </span>
              </div>
              <button
                type="button"
                disabled={isFuture}
                aria-pressed={t.status === "done"}
                onClick={() => set(t.id, t.status, "done")}
                className={`${BTN} border-2 ${
                  t.status === "done" ? "border-brand bg-brand text-white" : "border-brand-line bg-white text-brand"
                } disabled:opacity-40`}
              >
                <CheckIcon size={18} />
                Hecho
              </button>
              <button
                type="button"
                disabled={isFuture}
                aria-pressed={t.status === "missed"}
                onClick={() => set(t.id, t.status, "missed")}
                className={`${BTN} border-2 ${
                  t.status === "missed" ? "border-no bg-no text-white" : "border-no-line bg-white text-no"
                } disabled:opacity-40`}
              >
                <XIcon size={18} />
                No
              </button>
            </div>
          );
        })}
      </section>
    </>
  );
}
