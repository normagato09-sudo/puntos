import { BottomNav } from "@/components/bottom-nav";
import { requireFamily } from "@/lib/auth";
import { getChild } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HijoLayout({ children, params }: LayoutProps<"/hijo/[id]">) {
  const family = await requireFamily();
  const { id } = await params;
  const kid = await getChild(family.id, Number(id));
  const base = `/hijo/${kid.id}`;
  return (
    <>
      <main className="pb-nav mx-auto min-h-dvh max-w-md px-5 pt-6">{children}</main>
      <BottomNav
        items={[
          { href: base, match: base, exact: true, label: "Hoy", icon: "home" },
          { href: `${base}/tabla`, match: `${base}/tabla`, label: "Tabla", icon: "grid" },
          { href: `${base}/premios`, match: `${base}/premios`, label: "Premios", icon: "gift" },
          { href: `${base}/perfil`, match: `${base}/perfil`, label: "Perfil", icon: "user" },
        ]}
      />
    </>
  );
}
