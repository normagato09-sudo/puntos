import { BottomNav } from "@/components/bottom-nav";
import { requireFamily } from "@/lib/auth";
import { getChild } from "@/lib/data";
import { kidNavItems } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function HijoLayout({ children, params }: LayoutProps<"/hijo/[id]">) {
  const family = await requireFamily();
  const { id } = await params;
  const kid = await getChild(family.id, Number(id));
  return (
    <>
      <main className="pb-nav mx-auto min-h-dvh max-w-md px-5 pt-6">{children}</main>
      <BottomNav items={kidNavItems(kid.id)} />
    </>
  );
}
