import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { BackIcon, ExternalIcon } from "@/components/icons";
import { RewardThumb } from "@/components/points-pill";
import { requireParent } from "@/lib/auth";
import { getChild } from "@/lib/data";
import { ApprovePanel } from "./approve-panel";

export default async function AprobarPage({ params }: { params: Promise<{ id: string }> }) {
  const family = await requireParent();
  const { id } = await params;
  const rewardId = Number(id);
  if (!Number.isInteger(rewardId)) notFound();
  const db = await getDb();
  const [row] = await db
    .select({ reward: schema.reward })
    .from(schema.reward)
    .innerJoin(schema.child, eq(schema.child.id, schema.reward.childId))
    .where(and(eq(schema.reward.id, rewardId), eq(schema.child.familyId, family.id)));
  if (!row) notFound();
  const r = row.reward;
  const kid = await getChild(family.id, r.childId);
  const initial = r.approvedPrice ?? r.childPrice ?? 10;

  const statusText =
    r.status === "approved"
      ? `Aprobado por ${r.approvedPrice} puntos. Puedes cambiar el precio.`
      : r.status === "rejected"
        ? "Le dijisteis que ahora no. Podéis aprobarlo si cambiáis de idea."
        : r.status === "redeemed"
          ? "Ya está canjeado."
          : r.status === "redeem_requested"
            ? "Lo ha pedido canjear. Confírmalo en la lista de premios."
            : null;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <Link
          href={`/padres/premios?hijo=${kid.id}`}
          className="flex h-11 items-center gap-1.5 text-[15px] font-extrabold"
        >
          <BackIcon size={20} />
          Volver
        </Link>
        <span className="rounded-full bg-ink px-2.5 py-1.5 text-xs font-extrabold text-white">Modo padres</span>
      </div>

      <div className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-4">
        <RewardThumb photo={r.photo} tone="sun" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px] font-bold text-muted">{kid.name} ha pedido</span>
          <span className="font-display text-[22px] leading-tight font-semibold">{r.name}</span>
          <span className="text-[13px] font-bold text-muted">
            {r.childPrice != null ? `Precio que ha puesto: unos ${r.childPrice} €` : "No ha puesto precio"}
          </span>
        </div>
      </div>

      {r.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.photo} alt={`Foto de ${r.name}`} className="max-h-72 w-full rounded-[20px] object-contain bg-white border border-line" />
      )}

      {r.link ? (
        <a
          href={r.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] border-2 border-brand bg-white text-[15px] font-extrabold text-brand-dark"
        >
          <ExternalIcon size={18} />
          Ver el regalo en la tienda
        </a>
      ) : (
        <p className="text-center text-[13px] font-semibold text-muted">No ha añadido enlace de la tienda.</p>
      )}

      {statusText && <p className="rounded-2xl bg-sun-soft px-3.5 py-2.5 text-[13px] font-bold">{statusText}</p>}

      {r.status !== "redeemed" && r.status !== "redeem_requested" && (
        <ApprovePanel rewardId={r.id} initial={initial} points={kid.points} />
      )}
    </div>
  );
}
