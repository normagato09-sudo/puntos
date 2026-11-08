import Link from "next/link";
import { parentSetTask } from "@/app/actions";
import { BackIcon, CheckIcon, ChevronRightIcon, StarIcon, XIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { requireParent } from "@/lib/auth";
import { activeTasks, listChildren, listRewards, logsBetween, nextGoal, tasksForDay } from "@/lib/data";
import {
  DAY_KEYS,
  DAY_NAMES,
  addDays,
  isISODate,
  mondayOf,
  shortDate,
  todayISO,
  weekDates,
  weekLabel,
  weekdayIndex,
} from "@/lib/dates";
import { pendingRewardCount } from "@/lib/queries";
import { NoKids, ParentHeader, ParentNav, ProgressBar, pickChild } from "./shared";

const BTN =
  "flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl px-2.5 text-[13px] font-extrabold box-border";

export default async function SemanaPage({
  searchParams,
}: {
  searchParams: Promise<{ hijo?: string; dia?: string }>;
}) {
  const family = await requireParent();
  const sp = await searchParams;
  const [kids, pendingCount] = await Promise.all([listChildren(family.id), pendingRewardCount(family.id)]);
  const kid = pickChild(kids, sp.hijo);
  const today = todayISO();
  const day = isISODate(sp.dia) ? sp.dia : today;
  const monday = mondayOf(day);

  if (!kid) {
    return (
      <>
        <ParentHeader kids={kids} selected={null} basePath="/padres" subtitle="Panel de padres" />
        <div className="mt-6">
          <NoKids />
        </div>
        <ParentNav pendingRewards={pendingCount} />
      </>
    );
  }

  const dates = weekDates(monday);
  const [tasks, logs, rewards] = await Promise.all([
    activeTasks(kid.id),
    logsBetween(kid.id, dates[0], dates[6]),
    listRewards(kid.id),
  ]);

  const goal = nextGoal(rewards, kid.points);
  const goalPrice = goal?.reward.approvedPrice ?? 0;
  const pct = goal ? (kid.points / Math.max(goalPrice, 1)) * 100 : 0;
  const readyToRedeem = rewards.filter(
    (r) => r.status === "approved" && r.approvedPrice != null && r.approvedPrice <= kid.points,
  );
  const goalText = !goal
    ? "Aún no tiene ningún regalo aprobado"
    : goal.reached
      ? `Ya puede canjear ${goal.reward.name}`
      : `Faltan ${goalPrice - kid.points} para ${goal.reward.name} (${goalPrice})` +
        (readyToRedeem.length ? ` · ya puede canjear ${readyToRedeem.at(-1)!.name}` : "");

  const dayTasks = tasksForDay(tasks, logs, day);
  const waiting = dayTasks.filter((t) => t.status === "waiting").length;
  const doneToday = dayTasks.filter((t) => t.status === "done").length;
  const isFuture = day > today;
  const q = (d: string) => `/padres?hijo=${kid.id}&dia=${d}`;

  return (
    <>
      <div className="flex flex-col gap-4">
        <ParentHeader
          kids={kids}
          selected={kid}
          basePath="/padres"
          subtitle={`Panel de padres · ${weekLabel(monday)}`}
        />

        <div className="flex flex-col gap-3 rounded-[22px] bg-ink px-5 py-[18px] text-white">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl leading-none font-semibold text-sun">{kid.points}</span>
              <span className="text-[15px] font-bold">{kid.points === 1 ? "punto" : "puntos"}</span>
            </div>
            <StarIcon size={34} className="text-sun" />
          </div>
          <ProgressBar pct={pct} track="#4A4152" fill="#FFC94D" />
          <span className="text-[13px] font-semibold text-mist">{goalText}</span>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={q(addDays(monday, -7))}
            aria-label="Semana anterior"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-ink"
          >
            <BackIcon size={20} />
          </Link>
          <span className="text-sm font-extrabold text-muted">
            {monday === mondayOf(today) ? "Esta semana" : weekLabel(monday)}
          </span>
          <Link
            href={q(addDays(monday, 7))}
            aria-label="Semana siguiente"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-ink"
          >
            <ChevronRightIcon size={20} />
          </Link>
        </div>

        <div className="-mt-2 grid grid-cols-7 gap-1.5">
          {dates.map((d, i) => {
            const list = tasksForDay(tasks, logs, d);
            const done = list.filter((t) => t.status === "done").length;
            const wait = list.some((t) => t.status === "waiting");
            const on = d === day;
            return (
              <Link
                key={d}
                href={q(d)}
                aria-label={`${DAY_NAMES[i]} ${shortDate(d)}: ${done} de ${list.length} hechas`}
                aria-current={on ? "date" : undefined}
                className={`relative flex h-14 flex-col items-center justify-center gap-px rounded-[14px] border ${
                  on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
                } ${d > today && !on ? "opacity-60" : ""}`}
              >
                <span className="font-display text-[17px] font-semibold">{DAY_KEYS[i]}</span>
                <span className="text-[11px] font-bold">
                  {done}/{list.length}
                </span>
                {wait && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sun" />}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="mt-5 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">
            {DAY_NAMES[weekdayIndex(day)]} · {shortDate(day)}
          </h2>
          {waiting ? (
            <span className="rounded-full bg-sun px-2.5 py-1 text-[13px] font-extrabold text-ink">
              {waiting} por confirmar
            </span>
          ) : (
            <span className="text-[13px] font-bold text-muted">+{doneToday} pts este día</span>
          )}
        </div>

        {isFuture && (
          <p className="text-[13px] font-semibold text-muted">Este día todavía no ha llegado.</p>
        )}

        {dayTasks.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-muted">
            No hay tareas para este día.{" "}
            <Link href={`/padres/tareas?hijo=${kid.id}`} className="font-extrabold text-brand-dark underline">
              Configurar tareas
            </Link>
          </p>
        )}

        {dayTasks.map(({ task, status }) => {
          const w = status === "waiting";
          return (
            <div
              key={task.id}
              className={`flex items-center gap-2 rounded-2xl border py-2.5 pr-2.5 pl-3.5 ${
                w ? "border-sun-line bg-sun-soft" : "border-line bg-white"
              }`}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-bold">{task.name}</span>
                <span className={`text-xs font-extrabold ${w ? "text-sun-ink" : "text-muted"}`}>
                  {w
                    ? "Dice que la ha hecho · ¿confirmas?"
                    : status === "done"
                      ? "+1 punto · confirmada"
                      : status === "missed"
                        ? "No hecha"
                        : "1 punto"}
                </span>
              </div>
              <form action={parentSetTask.bind(null, task.id, day, "done")}>
                <SubmitButton
                  disabled={isFuture}
                  aria-pressed={status === "done"}
                  className={`${BTN} border-2 ${
                    status === "done"
                      ? "border-brand bg-brand text-white"
                      : "border-brand-line bg-white text-brand"
                  } disabled:opacity-40`}
                >
                  <CheckIcon size={18} />
                  Hecho
                </SubmitButton>
              </form>
              <form action={parentSetTask.bind(null, task.id, day, "missed")}>
                <SubmitButton
                  disabled={isFuture}
                  aria-label="No"
                  aria-pressed={status === "missed"}
                  className={`${BTN} border-2 ${
                    status === "missed" ? "border-no bg-no text-white" : "border-no-line bg-white text-no"
                  } disabled:opacity-40`}
                >
                  <XIcon size={18} />
                  No
                </SubmitButton>
              </form>
            </div>
          );
        })}
      </section>

      <ParentNav childId={kid.id} pendingRewards={pendingCount} />
    </>
  );
}
