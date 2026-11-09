import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { FamilyIcon } from "@/components/icons";
import { InstallButton } from "@/components/install-button";
import { requireFamily } from "@/lib/auth";
import { completeDays, getChild, listRewards } from "@/lib/data";

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const family = await requireFamily();
  const { id } = await params;
  const kid = await getChild(family.id, Number(id));
  const [days, rewards] = await Promise.all([completeDays(kid.id), listRewards(kid.id)]);
  const got = rewards.filter((r) => r.status === "redeemed").length;

  const stat = "flex flex-col items-center gap-1 rounded-2xl border border-line bg-white px-3 py-4";
  return (
    <div className="flex flex-col items-center gap-5 pt-4">
      <Avatar color={kid.color} seed={kid.id} size={120} radius={22} />
      <h1 className="font-display text-3xl font-semibold">{kid.name}</h1>
      <div className="grid w-full grid-cols-3 gap-2.5">
        <div className={stat}>
          <span className="font-display text-3xl font-semibold text-ink">{kid.points}</span>
          <span className="text-xs font-bold text-muted">puntos</span>
        </div>
        <div className={stat}>
          <span className="font-display text-3xl font-semibold text-brand">{days}</span>
          <span className="text-center text-xs font-bold text-muted">días completos</span>
        </div>
        <div className={stat}>
          <span className="font-display text-3xl font-semibold text-sun-ink">{got}</span>
          <span className="text-center text-xs font-bold text-muted">premios</span>
        </div>
      </div>
      <p className="text-center text-sm font-semibold text-muted">Cada día con todas las tareas hechas es 1 punto, y cada punto es 1 €.</p>
      <InstallButton tone="light" />
      <Link
        href="/"
        className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-base font-extrabold text-white"
      >
        <FamilyIcon size={22} />
        Cambiar de perfil
      </Link>
    </div>
  );
}
