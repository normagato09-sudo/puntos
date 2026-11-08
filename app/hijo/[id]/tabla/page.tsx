import { KidTable } from "@/components/views/kid-table";
import { requireFamily } from "@/lib/auth";
import { getChild, listRewards } from "@/lib/data";
import { goalInfos, serverStamp } from "@/lib/view-data";

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
  const rewards = await listRewards(kid.id);
  return (
    <KidTable
      data={{
        stamp: serverStamp(),
        kind: "kidTable",
        childId: kid.id,
        points: kid.points,
        goals: goalInfos(rewards),
        page: Number(sp.pagina) || undefined,
      }}
    />
  );
}
