import { isParent, requireFamily } from "@/lib/auth";
import { listChildren } from "@/lib/data";
import { ProfilesScreen } from "./profiles-screen";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const family = await requireFamily();
  const [kids, parent, sp] = await Promise.all([listChildren(family.id), isParent(family), searchParams]);
  return (
    <ProfilesScreen
      kids={kids.map((k) => ({ id: k.id, name: k.name, color: k.color, points: k.points }))}
      parentUnlocked={parent}
      askPin={sp.pin === "1"}
    />
  );
}
