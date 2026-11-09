import Link from "next/link";
import { archiveTask, toggleTaskDay } from "@/app/actions";
import { ChevronRightIcon, TrashIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { requireParent } from "@/lib/auth";
import { activeTasks, listChildren } from "@/lib/data";
import { DAY_KEYS, DAY_NAMES } from "@/lib/dates";
import { pendingRewardCount } from "@/lib/queries";
import { NoKids, ParentHeader, ParentNav, pickChild } from "../shared";
import { NewTaskForm, SettingsForms } from "./forms";
import { TaskName } from "./task-name";

export default async function TareasPage({ searchParams }: { searchParams: Promise<{ hijo?: string }> }) {
  const family = await requireParent();
  const sp = await searchParams;
  const [kids, pendingCount] = await Promise.all([listChildren(family.id), pendingRewardCount(family.id)]);
  const kid = pickChild(kids, sp.hijo);
  const tasks = kid ? await activeTasks(kid.id) : [];

  return (
    <>
      <div className="flex flex-col gap-3">
        <ParentHeader kids={kids} selected={kid} basePath="/padres/tareas" subtitle="Panel de padres" />
        <h1 className="mt-1 font-display text-[28px] font-semibold">Tareas</h1>

        <div className="flex flex-col gap-0.5 rounded-2xl bg-ink px-3.5 py-3 text-white">
          <span className="font-display text-lg font-semibold text-sun">Día con todas las tareas hechas = 1 punto = 1 €</span>
          <span className="text-[13px] font-semibold text-mist">Si un día falta alguna, ese día no suma (pero tampoco resta).</span>
        </div>

        {!kid && <NoKids />}

        {kid && tasks.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-muted">
            {kid.name} no tiene tareas. Añade la primera aquí abajo.
          </p>
        )}

        {tasks.map((t) => (
          <div key={t.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-white pt-2.5 pr-2 pb-3 pl-3.5">
            <div className="flex items-center justify-between gap-2">
              <TaskName id={t.id} name={t.name} />
              <form action={archiveTask.bind(null, t.id)}>
                <SubmitButton
                  aria-label={`Borrar la tarea ${t.name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-cream hover:text-no"
                >
                  <TrashIcon size={18} />
                </SubmitButton>
              </form>
            </div>
            <div className="grid grid-cols-7 gap-1 pr-1.5">
              {DAY_KEYS.map((k, i) => {
                const on = t.days[i] === "1";
                return (
                  <form key={k} action={toggleTaskDay.bind(null, t.id, i)}>
                    <SubmitButton
                      aria-pressed={on}
                      aria-label={`${DAY_NAMES[i]}: ${on ? "toca" : "no toca"}`}
                      className={`flex h-11 w-full items-center justify-center rounded-[10px] text-[13px] font-extrabold ${
                        on ? "bg-ink text-white" : "border border-line-strong bg-cream text-muted"
                      }`}
                    >
                      {k}
                    </SubmitButton>
                  </form>
                );
              })}
            </div>
          </div>
        ))}

        {kid && <NewTaskForm childId={kid.id} />}

        <h2 className="mt-6 font-display text-xl font-semibold">Ajustes</h2>
        <Link
          href="/padres/perfiles"
          className="flex h-14 items-center justify-between rounded-2xl border border-line bg-white px-4 text-[15px] font-extrabold"
        >
          Editar perfiles y añadir hijos
          <ChevronRightIcon size={18} className="text-muted" />
        </Link>
        <SettingsForms />
      </div>
      <ParentNav childId={kid?.id} pendingRewards={pendingCount} />
    </>
  );
}
