import { requireParent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PadresLayout({ children }: { children: React.ReactNode }) {
  await requireParent();
  return <main className="pb-nav mx-auto min-h-dvh max-w-md px-5 pt-6">{children}</main>;
}
