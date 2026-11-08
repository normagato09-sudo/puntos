"use client";

import Link from "next/link";
import { useState } from "react";
import { BackIcon, ChevronRightIcon, SmallGiftIcon } from "@/components/icons";
import { PointsPill } from "@/components/points-pill";
import { plural, snapKey, useSaveSnapshot, type KidTableData } from "./snapshot";

export function KidTable({ data, fromServer = true }: { data: KidTableData; fromServer?: boolean }) {
  useSaveSnapshot(snapKey.kidTable(data.childId), data, fromServer);
  const { points, goals } = data;

  const top = Math.max(points, ...goals.map((g) => g.price), 1);
  const pages = Math.max(1, Math.ceil(top / 100));
  const defaultPage = Math.min(pages, Math.max(1, Math.ceil(Math.max(points, 1) / 100)));
  const [page, setPageState] = useState(Math.min(pages, Math.max(1, data.page || defaultPage)));
  const start = (page - 1) * 100 + 1;

  function setPage(p: number) {
    setPageState(p);
    window.history.replaceState(null, "", `/hijo/${data.childId}/tabla?pagina=${p}`);
  }

  const byPrice = new Map<number, string[]>();
  for (const g of goals) byPrice.set(g.price, [...(byPrice.get(g.price) ?? []), g.name]);

  const cells = Array.from({ length: 100 }, (_, i) => {
    const n = start + i;
    const gift = byPrice.get(n);
    const done = n <= points;
    const here = n === points;
    let cls: string;
    if (gift) {
      cls = `bg-sun text-ink font-extrabold ${done ? "outline-3 -outline-offset-3 outline-brand" : ""} ${here ? "ring-2 ring-ink ring-offset-1" : ""}`;
    } else if (here) cls = "bg-white text-ink font-extrabold border-2 border-ink";
    else if (done) cls = "bg-brand text-white font-bold";
    else cls = "bg-cell text-muted font-bold";
    const label = gift
      ? `${n}: ${gift.join(", ")}${done ? " (alcanzado)" : ""}`
      : `${n}${here ? " (estás aquí)" : done ? " (conseguido)" : ""}`;
    return { n, gift: !!gift, cls, label };
  });

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
            <button type="button" onClick={() => setPage(page - 1)} aria-label="Tabla anterior" className={arrow}>
              <BackIcon size={20} />
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
          <span className="font-display text-lg font-semibold">
            Del {start} al {start + 99}
          </span>
          {page < pages ? (
            <button type="button" onClick={() => setPage(page + 1)} aria-label="Tabla siguiente" className={arrow}>
              <ChevronRightIcon size={20} />
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
        </div>
      )}

      <ol
        className="grid grid-cols-10 gap-1 rounded-[20px] border border-line bg-white p-2.5"
        aria-label={`Tabla del ${start} al ${start + 99}`}
      >
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
            <Link href={`/hijo/${data.childId}/premios/nuevo`} className="font-extrabold text-brand-dark underline">
              Pedir un premio
            </Link>
          </p>
        )}
        {goals.map((g) => {
          const ready = points >= g.price;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setPage(Math.max(1, Math.ceil(g.price / 100)))}
              className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-3 py-2.5 text-left"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-sun font-display text-lg font-semibold">
                {g.price}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-extrabold">{g.name}</span>
                <span className={`text-xs font-extrabold ${ready ? "text-brand-dark" : "text-muted"}`}>
                  {g.requested
                    ? "¡Pedido! Esperando a tus padres"
                    : ready
                      ? "¡Ya lo puedes canjear!"
                      : `Faltan ${plural(g.price - points, "punto", "puntos")}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
