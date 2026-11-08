"use client";

import Link from "next/link";
import { useBrowserOnline } from "@/lib/offline/hooks";

/** Si algo falla (normalmente por falta de conexión), mensaje claro y botón para reintentar. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const offline = !useBrowserOnline();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-7 text-center">
      <h1 className="font-display text-2xl font-semibold">
        {offline ? "Sin conexión" : "Algo no ha ido bien"}
      </h1>
      <p className="text-sm font-semibold text-muted">
        {offline
          ? "Esto necesita internet. Lo que marcaste como hecho se guarda y se enviará después."
          : "Prueba otra vez en un momento."}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => reset()} className="h-12 rounded-2xl bg-brand px-5 font-extrabold text-white">
          Reintentar
        </button>
        <Link href="/" className="flex h-12 items-center rounded-2xl border-2 border-line-strong px-5 font-extrabold">
          Perfiles
        </Link>
      </div>
    </main>
  );
}
