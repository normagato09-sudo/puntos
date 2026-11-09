import { ParentWeek } from "@/components/views/parent-week";
import { requireParent } from "@/lib/auth";
import { activeTasks, dayPointsBetween, listChildren, listRewards, logsBetween } from "@/lib/data";
import { isISODate, mondayOf, todayISO, weekDates, weekLabel } from "@/lib/dates";
import { pendingRewardCount } from "@/lib/queries";
import { goalInfos, serverStamp } from "@/lib/view-data";
import { NoKids, ParentHeader, ParentNav, pickChild } from "./shared";

export default async function SemanaPage({
  searchParams,
}: {
  searchParams: Promise<{ hijo?: string; dia?: string }>;
}) {
  const family = await requireParent();
  const sp = await searchParams;
  const [kids, pendingCount] = await Promise.all([listChildren(family.id), pendingRewardCount(family.id)]);
  const kid = pickChild(kids, sp.hijo);
  const today = todayISO();
  const day = isISODate(sp.dia) ? sp.dia : today;
  const monday = mondayOf(day);

  if (!kid) {
    return (
      <>
        <ParentHeader kids={kids} selected={null} basePath="/padres" subtitle="Panel de padres" />
        <div className="mt-6">
          <NoKids />
        </div>
        <ParentNav pendingRewards={pendingCount} />
      </>
    );
  }

  const dates = weekDates(monday);
  const [tasks, logs, rewards, dayPoints] = await Promise.all([
    activeTasks(kid.id),
    logsBetween(kid.id, dates[0], dates[6]),
    listRewards(kid.id),
    dayPointsBetween(kid.id, dates[0], dates[6]),
  ]);

  return (
    <>
      <ParentWeek
        data={{
          stamp: serverStamp(),
          kind: "parentWeek",
          childId: kid.id,
          points: kid.points,
          monday,
          today,
          day,
          tasks: tasks.map((t) => ({ id: t.id, name: t.name, days: t.days })),
          logs: Object.fromEntries(logs),
          dayPoints,
          goals: goalInfos(rewards),
        }}
        header={
          <ParentHeader
            kids={kids}
            selected={kid}
            basePath="/padres"
            subtitle={`Panel de padres · ${weekLabel(monday)}`}
          />
        }
      />
      <ParentNav childId={kid.id} pendingRewards={pendingCount} />
    </>
  );
}
