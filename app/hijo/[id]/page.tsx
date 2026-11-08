import Link from "next/link";
import { childToggleTask } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import { CheckIcon, ClockIcon, StarIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { requireFamily } from "@/lib/auth";
import { activeTasks, getChild, listRewards, logsBetween, nextGoal, tasksForDay } from "@/lib/data";
import { DAY_NAMES, todayISO, weekdayIndex } from "@/lib/dates";

export default async function HoyPage({ params }: { params: Promise<{ id: string }> }) {
  const family = await requireFamily();
  const { id } = await params;
  const kid = await getChild(family.id, Number(id));
  const today = todayISO();
  const [tasks, logs, rewards] = await Promise.all([
    activeTasks(kid.id),
    logsBetween(kid.id, today, today),
    listRewards(kid.id),
  ]);
  const list = tasksForDay(tasks, logs, today);
  const goal = nextGoal(rewards, kid.points);
  const price = goal?.reward.approvedPrice ?? 0;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <Avatar color={kid.color} seed={kid.id} size={52} radius={14} />
        <h1 className="font-display text-[28px] leading-tight font-semibold">¡Hola, {kid.name}!</h1>
      </div>

      <div className="flex flex-col gap-3 rounded-[22px] bg-sun px-5 py-[18px]">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[52px] leading-none font-semibold">{kid.points}</span>
            <span className="text-base font-extrabold">{kid.points === 1 ? "punto" : "puntos"}</span>
          </div>
          <StarIcon filled size={40} className="text-ink" />
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-white px-3.5 py-3">
          {goal ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-bold text-muted">Mi meta</span>
                <span className="text-[13px] font-extrabold">
                  {Math.min(kid.points, price)} / {price}
                </span>
              </div>
              <span className="font-display text-[19px] font-semibold">{goal.reward.name}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-track">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.min(100, (kid.points / Math.max(price, 1)) * 100)}%` }}
                />
              </div>
              <span className="text-[13px] font-extrabold text-brand-dark">
                {goal.reached ? "¡Ya lo puedes canjear!" : `¡Solo te faltan ${price - kid.points} ${price - kid.points === 1 ? "punto" : "puntos"}!`}
              </span>
            </>
          ) : (
            <>
              <span className="text-[13px] font-bold text-muted">Mi meta</span>
              <span className="text-sm font-bold">Todavía no tienes ningún premio aprobado.</span>
              <Link href={`/hijo/${kid.id}/premios/nuevo`} className="text-[13px] font-extrabold text-brand-dark underline">
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

      {list.length === 0 && (
        <p className="rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-muted">
          Hoy no tienes tareas. ¡Día libre!
        </p>
      )}

      {list.map(({ task, status }) => {
        const ok = status === "done";
        const wait = status === "waiting";
        const missed = status === "missed";
        return (
          <div
            key={task.id}
            className={`flex min-h-16 items-center gap-3 rounded-2xl border py-2.5 pr-2.5 pl-3 ${
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
              <span className="text-[15px] font-bold">{task.name}</span>
              <span
                className={`text-xs font-extrabold ${ok ? "text-brand-dark" : wait ? "text-sun-ink" : "text-muted"}`}
              >
                {ok ? "+1 punto · ¡confirmada!" : wait ? "Esperando a tus padres" : missed ? "Hoy no ha sumado" : "+1 punto"}
              </span>
            </div>
            {!status && (
              <form action={childToggleTask.bind(null, task.id)}>
                <SubmitButton className="h-11 rounded-xl bg-brand px-3.5 text-sm font-extrabold text-white">
                  ¡Hecho!
                </SubmitButton>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
