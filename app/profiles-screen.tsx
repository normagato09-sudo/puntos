"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FamilyIcon, LockIcon, PlusIcon, StarIcon } from "@/components/icons";
import { PinPad } from "@/components/pin-pad";

type Kid = { id: number; name: string; color: string; points: number };

export function ProfilesScreen({
  kids,
  parentUnlocked,
  askPin,
}: {
  kids: Kid[];
  parentUnlocked: boolean;
  askPin: boolean;
}) {
  const router = useRouter();
  const [pinFor, setPinFor] = useState<string | null>(askPin ? "/padres" : null);

  function goParent(next: string) {
    if (parentUnlocked) router.push(next);
    else setPinFor(next);
  }

  return (
    <main className="min-h-dvh bg-night text-white">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center gap-10 px-7 pt-16 pb-10 sm:pt-24">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sun">
            <StarIcon filled size={26} />
            <span className="font-display text-xl font-semibold">Puntos</span>
          </div>
          <h1 className="font-display text-[32px] font-semibold sm:text-4xl">¿Quién eres?</h1>
        </div>

        <div className="grid w-full grid-cols-2 justify-items-center gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-4">
          {kids.map((k) => (
            <Link
              key={k.id}
              href={`/hijo/${k.id}`}
              className="group flex flex-col items-center gap-2.5 rounded-3xl text-white"
            >
              <div className="rounded-[22px] ring-white transition group-hover:ring-4 group-focus-visible:ring-4">
                <Avatar color={k.color} seed={k.id} size={140} radius={22} />
              </div>
              <span className="text-[17px] font-extrabold">{k.name}</span>
              <span className="-mt-1.5 text-[13px] font-bold text-sun">
                {k.points} {k.points === 1 ? "punto" : "puntos"}
              </span>
            </Link>
          ))}

          <button
            type="button"
            onClick={() => goParent("/padres")}
            className="group flex flex-col items-center gap-2.5 rounded-3xl text-white"
          >
            <div className="relative flex h-[140px] w-[140px] items-center justify-center rounded-[22px] bg-night-2 ring-white transition group-hover:ring-4">
              <FamilyIcon size={70} strokeWidth={1.6} />
              <span className="absolute right-2.5 bottom-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-night text-sun">
                <LockIcon size={16} strokeWidth={2.4} />
              </span>
            </div>
            <span className="text-[17px] font-extrabold">Padres</span>
            <span className="-mt-1.5 text-[13px] font-bold text-night-text">Con PIN</span>
          </button>

          <button
            type="button"
            onClick={() => goParent("/padres/perfiles?nuevo=1")}
            className="group flex flex-col items-center gap-2.5 rounded-3xl text-night-text"
          >
            <div className="flex h-[140px] w-[140px] items-center justify-center rounded-[22px] border-2 border-dashed border-night-line transition group-hover:border-night-text">
              <PlusIcon size={44} />
            </div>
            <span className="text-[17px] font-extrabold">Añadir hijo</span>
          </button>
        </div>

        <div className="flex-1" />
        <button
          type="button"
          onClick={() => goParent("/padres/perfiles")}
          className="h-11 rounded-xl border border-night-line px-5 text-sm font-extrabold text-white hover:border-night-text"
        >
          Editar perfiles
        </button>
      </div>

      {pinFor && (
        <PinPad
          onClose={() => setPinFor(null)}
          onSuccess={() => {
            const next = pinFor;
            setPinFor(null);
            router.push(next);
            router.refresh();
          }}
        />
      )}
    </main>
  );
}
