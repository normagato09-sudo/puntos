import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FAMILY_COOKIE, familyToken, getFamily } from "@/lib/auth";
import { StarIcon } from "@/components/icons";
import { EnterForm, SetupForm } from "./forms";

export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  const family = await getFamily();
  if (family && (await cookies()).get(FAMILY_COOKIE)?.value === familyToken(family)) redirect("/");

  return (
    <main className="min-h-dvh bg-night text-white">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center gap-8 px-7 pt-20 pb-10">
        <div className="flex items-center gap-2 text-sun">
          <StarIcon filled size={26} />
          <span className="font-display text-xl font-semibold">Puntos</span>
        </div>
        {family ? <EnterForm /> : <SetupForm />}
      </div>
    </main>
  );
}
