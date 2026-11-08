import Link from "next/link";
import { leaveParent } from "@/app/actions";
import { FamilyIcon } from "@/components/icons";
import type { ChildWithPoints } from "@/lib/data";
import { BottomNav } from "@/components/bottom-nav";
import { parentNavItems } from "@/lib/nav";

export function pickChild(kids: ChildWithPoints[], hijo?: string) {
  const id = Number(hijo);
  return kids.find((k) => k.id === id) ?? kids[0] ?? null;
}

export function ParentNav({ childId, pendingRewards }: { childId?: number; pendingRewards?: number }) {
  return <BottomNav items={parentNavItems(childId, pendingRewards)} />;
}

/** Cabecera: subtítulo, chips para elegir hijo y botón para volver a perfiles. */
export function ParentHeader({
  kids,
  selected,
  basePath,
  subtitle,
}: {
  kids: ChildWithPoints[];
  selected: ChildWithPoints | null;
  basePath: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-[13px] font-bold text-muted">{subtitle}</span>
        <div className="flex flex-wrap gap-1.5">
          {kids.map((k) => {
            const on = selected?.id === k.id;
            return (
              <Link
                key={k.id}
                href={`${basePath}?hijo=${k.id}`}
                aria-current={on ? "true" : undefined}
                className={`flex h-10 items-center gap-2 rounded-full pr-3.5 pl-1.5 text-sm font-extrabold ${
                  on ? "bg-ink text-white" : "border border-line-strong bg-white text-ink"
                }`}
              >
                <span className="h-7 w-7 rounded-full" style={{ background: k.color }} />
                {k.name}
              </Link>
            );
          })}
        </div>
      </div>
      <form action={leaveParent}>
        <button
          aria-label="Volver a perfiles"
          title="Volver a perfiles"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-ink text-white"
        >
          <FamilyIcon size={22} />
        </button>
      </form>
    </div>
  );
}

export function NoKids() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-6 text-center">
      <p className="font-display text-xl font-semibold">Todavía no hay ningún hijo</p>
      <p className="text-sm font-semibold text-muted">Añade el primero para empezar a apuntar tareas.</p>
      <Link
        href="/padres/perfiles?nuevo=1"
        className="flex h-12 items-center rounded-2xl bg-brand px-5 font-extrabold text-white"
      >
        Añadir hijo
      </Link>
    </div>
  );
}

export function ProgressBar({ pct, track, fill }: { pct: number; track: string; fill: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full" style={{ background: track }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: fill }} />
    </div>
  );
}
