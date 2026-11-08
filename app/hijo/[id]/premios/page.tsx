import { KidRewards } from "@/components/views/kid-rewards";
import { requireFamily } from "@/lib/auth";
import { getChild, listRewards } from "@/lib/data";
import { rewardInfos, serverStamp } from "@/lib/view-data";

export default async function PremiosHijoPage({ params }: { params: Promise<{ id: string }> }) {
  const family = await requireFamily();
  const { id } = await params;
  const kid = await getChild(family.id, Number(id));
  const rewards = await listRewards(kid.id);
  return (
    <KidRewards
      data={{
        stamp: serverStamp(),
        kind: "kidRewards",
        childId: kid.id,
        points: kid.points,
        rewards: rewardInfos(rewards),
      }}
    />
  );
}
