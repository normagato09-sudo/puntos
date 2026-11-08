import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import { RewardThumb } from "@/components/points-pill";
import { requireParent } from "@/lib/auth";
import { listChildren, listRewards } from "@/lib/data";
import { longDate } from "@/lib/dates";
import { pendingRewardCount } from "@/lib/queries";
import { NoKids, ParentHeader, ParentNav, pickChild } from "../shared";
import { QueuedRewardOps } from "./queued-reward-ops";
import { RedeemActions } from "./redeem-actions";

export default async function PremiosPadresPage({ searchParams }: { searchParams: Promise<{ hijo?: string }> }) {
  const family = await requireParent();
  const sp = await searchParams;
  const [kids, pendingCount] = await Promise.all([listChildren(family.id), pendingRewardCount(family.id)]);
  const kid = pickChild(kids, sp.hijo);
  const rewards = kid ? await listRewards(kid.id) : [];

  const toDeliver = rewards.filter((r) => r.status === "redeem_requested");
  const toApprove = rewards.filter((r) => r.status === "pending");
  const approved = rewards
    .filter((r) => r.status === "approved")
    .sort((a, b) => (a.approvedPrice ?? 0) - (b.approvedPrice ?? 0));
  const done = rewards.filter((r) => r.status === "redeemed");
  const rejected = rewards.filter((r) => r.status === "rejected");

  const h2 = "mt-3 font-display text-xl font-semibold";
  const card = "flex items-center gap-3 rounded-[20px] border bg-white p-3.5";

  return (
    <>
      <div className="flex flex-col gap-3">
        <ParentHeader kids={kids} selected={kid} basePath="/padres/premios" subtitle="Panel de padres" />
        <h1 className="mt-1 font-display text-[28px] font-semibold">Premios</h1>
        {!kid && <NoKids />}

        {kid && (
          <div className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white">
            <span className="text-sm font-bold">{kid.name} tiene</span>
            <span className="font-display text-2xl font-semibold text-sun">
              {kid.points}{" "}
              <span className="font-sans text-sm font-bold text-white">{kid.points === 1 ? "punto" : "puntos"}</span>
            </span>
          </div>
        )}

        {kid && <QueuedRewardOps childId={kid.id} />}

        {toDeliver.length > 0 && (
          <>
            <h2 className={h2}>Quiere canjear</h2>
            {toDeliver.map((r) => (
              <div key={r.id} className={`${card} flex-col items-stretch border-2 border-sun`}>
                <div className="flex items-center gap-3">
                  <RewardThumb photo={r.photo} tone="sun" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-display text-lg leading-tight font-semibold">{r.name}</span>
                    <span className="text-[13px] font-bold text-muted">
                      {r.approvedPrice} puntos · confírmalo cuando se lo des
                    </span>
                  </div>
                </div>
                <RedeemActions rewardId={r.id} />
              </div>
            ))}
          </>
        )}

        {kid && (
          <>
            <h2 className={h2}>Por aprobar</h2>
            {toApprove.length === 0 && (
              <p className="text-sm font-semibold text-muted">No hay regalos nuevos pedidos.</p>
            )}
            {toApprove.map((r) => (
              <Link key={r.id} href={`/padres/premios/${r.id}`} className={`${card} border-line hover:border-brand`}>
                <RewardThumb photo={r.photo} tone="grey" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-display text-lg leading-tight font-semibold">{r.name}</span>
                  <span className="text-[13px] font-bold text-muted">
                    {r.childPrice != null ? `Precio que ha puesto: unos ${r.childPrice} €` : "Sin precio"}
                  </span>
                  <span className="text-xs font-extrabold text-brand-dark">Revisar y poner puntos</span>
                </div>
                <ChevronRightIcon size={20} className="text-muted" />
              </Link>
            ))}
          </>
        )}

        {approved.length > 0 && (
          <>
            <h2 className={h2}>Aprobados</h2>
            {approved.map((r) => {
              const p = r.approvedPrice ?? 0;
              const ready = kid!.points >= p;
              return (
                <div key={r.id} className={`${card} ${ready ? "border-brand" : "border-line"} flex-col items-stretch`}>
                  <Link href={`/padres/premios/${r.id}`} className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-sun font-display text-lg font-semibold">
                      {p}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[15px] font-extrabold">{r.name}</span>
                      <span className={`text-xs font-extrabold ${ready ? "text-brand-dark" : "text-muted"}`}>
                        {ready
                          ? "Ya lo puede canjear"
                          : `Le faltan ${p - kid!.points} ${p - kid!.points === 1 ? "punto" : "puntos"}`}
                      </span>
                    </div>
                    <ChevronRightIcon size={18} className="text-muted" />
                  </Link>
                  {ready && <RedeemActions rewardId={r.id} direct />}
                </div>
              );
            })}
          </>
        )}

        {done.length > 0 && (
          <>
            <h2 className={h2}>Conseguidos</h2>
            {done.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-line bg-white px-3.5 py-2.5">
                <span className="text-[15px] font-extrabold">{r.name}</span>
                <span className="text-xs font-bold text-muted">
                  −{r.approvedPrice} pts{r.redeemedAt ? ` · ${longDate(r.redeemedAt.toISOString().slice(0, 10))}` : ""}
                </span>
              </div>
            ))}
          </>
        )}

        {rejected.length > 0 && (
          <>
            <h2 className={h2}>Ahora no</h2>
            {rejected.map((r) => (
              <Link
                key={r.id}
                href={`/padres/premios/${r.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-white px-3.5 py-2.5"
              >
                <span className="text-[15px] font-bold text-muted">{r.name}</span>
                <ChevronRightIcon size={18} className="text-muted" />
              </Link>
            ))}
          </>
        )}
      </div>
      <ParentNav childId={kid?.id} pendingRewards={pendingCount} />
    </>
  );
}
