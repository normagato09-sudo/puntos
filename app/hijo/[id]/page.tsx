import { KidToday } from "@/components/views/kid-today";
import { requireFamily } from "@/lib/auth";
import { activeTasks, getChild, listRewards, logsBetween } from "@/lib/data";
import { todayISO } from "@/lib/dates";
import { goalInfos, serverStamp } from "@/lib/view-data";

export default async function HoyPage({ params }: { params: Promise<{ id: string }> }) {
  const family = await requireFamily();
  const { id } = await params;
  const kid = await getChild(family.id, Number(id));
  const today = todayISO();
  const [tasks, logs, rewards] = await Promise.all([
    activeTasks(kid.id),
    logsBetween(kid.id, today, today),
    listRewards(kid.id),
  ]);

  return (
    <KidToday
      data={{
        stamp: serverStamp(),
        kind: "kidToday",
        childId: kid.id,
        name: kid.name,
        color: kid.color,
        points: kid.points,
        day: today,
        tasks: tasks.map((t) => ({ id: t.id, name: t.name, days: t.days })),
        logs: Object.fromEntries(logs),
        goals: goalInfos(rewards),
      }}
    />
  );
}
