import Link from "next/link";
import { deleteReward, requestRedeem } from "@/app/actions";
import { CheckIcon, ClockIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { PointsPill, RewardThumb } from "@/components/points-pill";
import { SubmitButton } from "@/components/submit-button";
import { requireFamily } from "@/lib/auth";
import { getChild, listRewards } from "@/lib/data";
import { longDate } from "@/lib/dates";

export default async function PremiosHijoPage({ params }: { params: Promise<{ id: string }> }) {
  const family = await requireFamily();
  const { id } = await params;
  const kid = await getChild(family.id, Number(id));
  const rewards = await listRewards(kid.id);

  const active = rewards
    .filter((r) => r.status !== "redeemed")
    .sort((a, b) => {
      // Primero los aprobados (de más barato a más caro), luego los pendientes.
      const rank = (s: string) => (s === "redeem_requested" ? 0 : s === "approved" ? 1 : s === "pending" ? 2 : 3);
      return rank(a.status) - rank(b.status) || (a.approvedPrice ?? 0) - (b.approvedPrice ?? 0);
    });
  const got = rewards.filter((r) => r.status === "redeemed");

  const title = "font-display text-lg font-semibold leading-tight";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-semibold">Mis premios</h1>
        <PointsPill points={kid.points} />
      </div>

      <Link
        href={`/hijo/${kid.id}/premios/nuevo`}
        className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-base font-extrabold text-white"
      >
        <PlusIcon size={20} strokeWidth={2.4} />
        Pedir un premio
      </Link>

      {active.length === 0 && (
        <p className="rounded-[20px] border border-line bg-white p-4 text-sm font-semibold text-muted">
          Aún no has pedido ningún premio. ¡Pide el primero!
        </p>
      )}

      {active.map((r) => {
        const price = r.approvedPrice ?? 0;
        const ready = r.status === "approved" && kid.points >= price;

        if (r.status === "pending" || r.status === "rejected") {
          const rejected = r.status === "rejected";
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-[20px] border-2 border-dashed border-dash bg-[#FBF6EE] p-3.5">
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-[14px] bg-track text-muted">
                {rejected ? <TrashIcon size={26} /> : <ClockIcon size={28} strokeWidth={2} />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={title}>{r.name}</span>
                <span className="text-xs font-bold text-muted">
                  {rejected
                    ? "Tus padres han dicho que ahora no"
                    : "Esperando a que tus padres le pongan puntos"}
                </span>
              </div>
              <form action={deleteReward.bind(null, r.id)}>
                <SubmitButton
                  aria-label={`Quitar ${r.name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-no"
                >
                  <TrashIcon size={18} />
                </SubmitButton>
              </form>
            </div>
          );
        }

        if (r.status === "redeem_requested") {
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-[20px] border-2 border-sun bg-white p-3.5">
              <RewardThumb photo={r.photo} tone="sun" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={title}>{r.name}</span>
                  <span className="text-sm font-extrabold whitespace-nowrap">{price} pts</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-extrabold text-sun-ink">
                  <ClockIcon size={16} />
                  ¡Pedido! Tus padres te lo darán pronto
                </span>
              </div>
            </div>
          );
        }

        if (ready) {
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-[20px] border-2 border-brand bg-white p-3.5">
              <RewardThumb photo={r.photo} tone="blue" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={title}>{r.name}</span>
                  <span className="text-sm font-extrabold whitespace-nowrap">{price} pts</span>
                </div>
                <span className="text-xs font-extrabold text-brand-dark">¡Ya lo puedes conseguir!</span>
                <form action={requestRedeem.bind(null, r.id)}>
                  <SubmitButton className="h-11 w-full rounded-xl bg-brand text-sm font-extrabold text-white">
                    Canjear
                  </SubmitButton>
                </form>
              </div>
            </div>
          );
        }

        return (
          <div key={r.id} className="flex items-center gap-3 rounded-[20px] border border-line bg-white p-3.5">
            <RewardThumb photo={r.photo} tone="sun" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className={title}>{r.name}</span>
                <span className="text-sm font-extrabold whitespace-nowrap">{price} pts</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-track">
                <div className="h-full rounded-full bg-[#E0A800]" style={{ width: `${(kid.points / Math.max(price, 1)) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-muted">
                {kid.points} de {price} · faltan {price - kid.points} {price - kid.points === 1 ? "punto" : "puntos"}
              </span>
            </div>
          </div>
        );
      })}

      <div className="mt-2 flex flex-col gap-2">
        <h2 className="font-display text-[17px] font-semibold">Conseguidos</h2>
        {got.length === 0 ? (
          <p className="text-[13px] font-semibold text-muted">Aquí saldrán los premios que ya hayas canjeado.</p>
        ) : (
          got.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-2.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-brand text-white">
                <CheckIcon size={18} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-extrabold">{r.name}</span>
                <span className="text-xs font-bold text-muted">
                  {r.approvedPrice} pts{r.redeemedAt ? ` · ${longDate(r.redeemedAt.toISOString().slice(0, 10))}` : ""}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
