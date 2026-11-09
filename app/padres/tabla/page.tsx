import { KidTable } from "@/components/views/kid-table";
import { requireParent } from "@/lib/auth";
import { listChildren, listRewards } from "@/lib/data";
import { pendingRewardCount } from "@/lib/queries";
import { goalInfos, serverStamp } from "@/lib/view-data";
import { NoKids, ParentHeader, ParentNav, pickChild } from "../shared";

/** Los padres ven la tabla del 1 al 100 de cada hijo. */
export default async function TablaPadresPage({
  searchParams,
}: {
  searchParams: Promise<{ hijo?: string; pagina?: string }>;
}) {
  const family = await requireParent();
  const sp = await searchParams;
  const [kids, pendingCount] = await Promise.all([listChildren(family.id), pendingRewardCount(family.id)]);
  const kid = pickChild(kids, sp.hijo);
  const header = <ParentHeader kids={kids} selected={kid} basePath="/padres/tabla" subtitle="Panel de padres" />;

  if (!kid) {
    return (
      <>
        {header}
        <div className="mt-6">
          <NoKids />
        </div>
        <ParentNav pendingRewards={pendingCount} />
      </>
    );
  }

  const rewards = await listRewards(kid.id);
  return (
    <>
      <KidTable
        parent={{ name: kid.name, header }}
        data={{
          stamp: serverStamp(),
          kind: "kidTable",
          childId: kid.id,
          points: kid.points,
          goals: goalInfos(rewards),
          page: Number(sp.pagina) || undefined,
        }}
      />
      <ParentNav childId={kid.id} pendingRewards={pendingCount} />
    </>
  );
}
