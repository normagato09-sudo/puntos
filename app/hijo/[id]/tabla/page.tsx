import Link from "next/link";
import { BackIcon, ChevronRightIcon, SmallGiftIcon } from "@/components/icons";
import { PointsPill } from "@/components/points-pill";
import { requireFamily } from "@/lib/auth";
import { getChild, listRewards, openGoals } from "@/lib/data";

export default async function TablaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const family = await requireFamily();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const kid = await getChild(family.id, Number(id));
  const goals = openGoals(await listRewards(kid.id));
  const points = kid.points;

  const top = Math.max(points, ...goals.map((g) => g.approvedPrice ?? 0), 1);
  const pages = Math.max(1, Math.ceil(top / 100));
  const defaultPage = Math.min(pages, Math.max(1, Math.ceil(Math.max(points, 1) / 100)));
  const page = Math.min(pages, Math.max(1, Number(sp.pagina) || defaultPage));
  const start = (page - 1) * 100 + 1;

  const byPrice = new Map<number, string[]>();
  for (const g of goals) {
    const p = g.approvedPrice!;
    byPrice.set(p, [...(byPrice.get(p) ?? []), g.name]);
  }

  const cells = Array.from({ length: 100 }, (_, i) => {
    const n = start + i;
    const gift = byPrice.get(n);
    const done = n <= points;
    const here = n === points;
    let cls = "";
    if (gift) {
      cls = `bg-sun text-ink font-extrabold ${done ? "outline-3 -outline-offset-3 outline-brand" : ""} ${here ? "ring-2 ring-ink ring-offset-1" : ""}`;
    } else if (here) {
      cls = "bg-white text-ink font-extrabold border-2 border-ink";
    } else if (done) {
      cls = "bg-brand text-white font-bold";
    } else {
      cls = "bg-cell text-muted font-bold";
    }
    const label = gift ? `${n}: ${gift.join(", ")}${done ? " (alcanzado)" : ""}` : `${n}${here ? " (estás aquí)" : done ? " (conseguido)" : ""}`;
    return { n, gift: !!gift, cls, label };
  });

  const base = `/hijo/${kid.id}/tabla`;
  const arrow = "flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-ink";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-semibold">Mi tabla</h1>
        <PointsPill points={points} />
      </div>
      <p className="text-sm font-semibold text-muted">
        Cada punto es 1 €. Las casillas amarillas tienen un regalo esperándote.
      </p>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={`${base}?pagina=${page - 1}`} aria-label="Tabla anterior" className={arrow}>
              <BackIcon size={20} />
            </Link>
          ) : (
            <span className="h-11 w-11" />
          )}
          <span className="font-display text-lg font-semibold">
            Del {start} al {start + 99}
          </span>
          {page < pages ? (
            <Link href={`${base}?pagina=${page + 1}`} aria-label="Tabla siguiente" className={arrow}>
              <ChevronRightIcon size={20} />
            </Link>
          ) : (
            <span className="h-11 w-11" />
          )}
        </div>
      )}

      <ol className="grid grid-cols-10 gap-1 rounded-[20px] border border-line bg-white p-2.5" aria-label={`Tabla del ${start} al ${start + 99}`}>
        {cells.map((c) => (
          <li
            key={c.n}
            aria-label={c.label}
            className={`relative flex aspect-square items-center justify-center rounded-[7px] text-xs sm:text-sm ${c.cls}`}
            style={c.n >= 100 ? { fontSize: 10 } : undefined}
          >
            {c.n}
            {c.gift && <SmallGiftIcon size={11} className="absolute top-0.5 right-0.5" />}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-x-3.5 gap-y-2 text-xs font-bold text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-[5px] bg-brand" />
          Ya conseguidos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-[5px] border-2 border-ink bg-white" />
          Estás aquí
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-[5px] bg-sun" />
          Regalo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-[5px] bg-sun outline-2 -outline-offset-2 outline-brand" />
          Regalo alcanzado
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {goals.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-3.5 text-sm font-semibold text-muted">
            Cuando tus padres aprueben un premio, saldrá aquí en su casilla.{" "}
            <Link href={`/hijo/${kid.id}/premios/nuevo`} className="font-extrabold text-brand-dark underline">
              Pedir un premio
            </Link>
          </p>
        )}
        {goals.map((g) => {
          const p = g.approvedPrice!;
          const ready = points >= p;
          return (
            <Link
              key={g.id}
              href={`${base}?pagina=${Math.ceil(p / 100)}`}
              className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-3 py-2.5"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-sun font-display text-lg font-semibold">
                {p}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-extrabold">{g.name}</span>
                <span className={`text-xs font-extrabold ${ready ? "text-brand-dark" : "text-muted"}`}>
                  {g.status === "redeem_requested"
                    ? "¡Pedido! Esperando a tus padres"
                    : ready
                      ? "¡Ya lo puedes canjear!"
                      : `Faltan ${p - points} ${p - points === 1 ? "punto" : "puntos"}`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
