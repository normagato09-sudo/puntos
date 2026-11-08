import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { requireParent } from "@/lib/auth";
import { listChildren } from "@/lib/data";
import { pendingRewardCount } from "@/lib/queries";
import { ParentNav } from "../shared";
import { AddChildForm, EditChildForm } from "./forms";

export default async function PerfilesPage({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const family = await requireParent();
  const sp = await searchParams;
  const [kids, pendingCount] = await Promise.all([listChildren(family.id), pendingRewardCount(family.id)]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link href="/" className="flex h-11 items-center gap-1.5 self-start text-[15px] font-extrabold">
          <BackIcon size={20} />
          Perfiles
        </Link>
        <h1 className="font-display text-[28px] font-semibold">Editar perfiles</h1>

        {kids.map((k) => (
          <EditChildForm key={k.id} id={k.id} name={k.name} color={k.color} />
        ))}

        <AddChildForm open={sp.nuevo === "1" || kids.length === 0} />
      </div>
      <ParentNav childId={kids[0]?.id} pendingRewards={pendingCount} />
    </>
  );
}
