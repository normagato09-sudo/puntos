"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { StarIcon } from "@/components/icons";
import { KidRewards } from "@/components/views/kid-rewards";
import { KidTable } from "@/components/views/kid-table";
import { KidToday } from "@/components/views/kid-today";
import { ParentWeek } from "@/components/views/parent-week";
import {
  snapKey,
  type KidRewardsData,
  type KidTableData,
  type KidTodayData,
  type ParentWeekData,
  type ProfileInfo,
} from "@/components/views/snapshot";
import { idbGet } from "@/lib/offline/idb";
import { kidNavItems, parentNavItems } from "@/lib/nav";
import { addDays } from "@/lib/dates";

type View =
  | { kind: "loading" }
  | { kind: "kidToday"; data: KidTodayData }
  | { kind: "kidTable"; data: KidTableData }
  | { kind: "kidRewards"; data: KidRewardsData }
  | { kind: "parentWeek"; data: ParentWeekData }
  | { kind: "none"; profiles: ProfileInfo[] };

async function resolve(from: string): Promise<View> {
  const url = new URL(from, window.location.origin);
  const kid = url.pathname.match(/^\/hijo\/(\d+)(\/tabla|\/premios)?\/?$/);
  if (kid) {
    const id = Number(kid[1]);
    if (kid[2] === "/tabla") {
      const d = await idbGet<KidTableData>(snapKey.kidTable(id));
      if (d) return { kind: "kidTable", data: d };
    } else if (kid[2] === "/premios") {
      const d = await idbGet<KidRewardsData>(snapKey.kidRewards(id));
      if (d) return { kind: "kidRewards", data: d };
    } else {
      const d = await idbGet<KidTodayData>(snapKey.kidToday(id));
      if (d) return { kind: "kidToday", data: d };
    }
  }
  if (url.pathname === "/padres") {
    const profiles = (await idbGet<ProfileInfo[]>(snapKey.profiles)) ?? [];
    const id = Number(url.searchParams.get("hijo")) || profiles[0]?.id;
    const d = id ? await idbGet<ParentWeekData>(snapKey.parentWeek(id)) : undefined;
    if (d) {
      // Mostrar el día pedido si cae en la semana guardada.
      const dia = url.searchParams.get("dia");
      const inWeek = dia && dia >= d.monday && dia <= addDays(d.monday, 6);
      return { kind: "parentWeek", data: inWeek ? { ...d, day: dia } : d };
    }
  }
  return { kind: "none", profiles: (await idbGet<ProfileInfo[]>(snapKey.profiles)) ?? [] };
}

export function OfflineScreen() {
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("from") || "/";
    const from = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
    resolve(from).then(setView);

    // En cuanto vuelva la conexión, abrir la pantalla de verdad.
    let stop = false;
    const tryBack = async () => {
      if (stop || !navigator.onLine) return;
      try {
        const res = await fetch(from, { method: "HEAD", cache: "no-store" });
        if (res.ok) window.location.replace(from);
      } catch {
        /* sigue sin conexión */
      }
    };
    tryBack();
    const timer = window.setInterval(tryBack, 15000);
    window.addEventListener("online", tryBack);
    return () => {
      stop = true;
      window.clearInterval(timer);
      window.removeEventListener("online", tryBack);
    };
  }, []);

  if (view.kind === "loading") return <main className="min-h-dvh bg-cream" />;

  if (view.kind === "none") {
    return (
      <main className="min-h-dvh bg-night text-white">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center gap-6 px-7 pt-20 pb-10 text-center">
          <div className="flex items-center gap-2 text-sun">
            <StarIcon filled size={26} />
            <span className="font-display text-xl font-semibold">Puntos</span>
          </div>
          <h1 className="font-display text-3xl font-semibold">Sin conexión</h1>
          <p className="text-sm font-semibold text-night-text">
            Esta pantalla todavía no está guardada en el móvil. Elige un perfil para ver sus últimos datos, o
            vuelve a intentarlo cuando haya internet.
          </p>
          {view.profiles.length > 0 && (
            <div className="grid w-full grid-cols-2 justify-items-center gap-5">
              {view.profiles.map((p) => (
                <a key={p.id} href={`/hijo/${p.id}`} className="flex flex-col items-center gap-2 text-white">
                  <Avatar color={p.color} seed={p.id} size={110} radius={20} />
                  <span className="text-base font-extrabold">{p.name}</span>
                </a>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-12 rounded-2xl bg-sun px-6 font-extrabold text-ink"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const isParent = view.kind === "parentWeek";
  return (
    <>
      <main className="pb-nav mx-auto min-h-dvh max-w-md px-5 pt-10">
        {view.kind === "kidToday" && <KidToday data={view.data} fromServer={false} />}
        {view.kind === "kidTable" && <KidTable data={view.data} fromServer={false} />}
        {view.kind === "kidRewards" && <KidRewards data={view.data} fromServer={false} />}
        {view.kind === "parentWeek" && (
          <ParentWeek
            data={view.data}
            fromServer={false}
            header={<span className="text-[13px] font-bold text-muted">Panel de padres · datos guardados</span>}
          />
        )}
      </main>
      <BottomNav items={isParent ? parentNavItems(view.data.childId) : kidNavItems(view.data.childId)} />
    </>
  );
}
