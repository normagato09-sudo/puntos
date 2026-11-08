import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { requireFamily } from "@/lib/auth";
import { getChild } from "@/lib/data";
import { WishForm } from "./wish-form";

export default async function NuevoPremioPage({ params }: { params: Promise<{ id: string }> }) {
  const family = await requireFamily();
  const { id } = await params;
  const kid = await getChild(family.id, Number(id));
  return (
    <div className="flex flex-col gap-4">
      <Link href={`/hijo/${kid.id}/premios`} className="flex h-11 items-center gap-1.5 self-start text-[15px] font-extrabold">
        <BackIcon size={20} />
        Premios
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[30px] font-semibold">¿Qué te gustaría?</h1>
        <p className="text-sm font-semibold text-muted">Tus padres lo mirarán y decidirán los puntos.</p>
      </div>
      <WishForm childId={kid.id} />
    </div>
  );
}
