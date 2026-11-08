"use client";

import { useActionState } from "react";
import { enterFamily, setupFamily } from "@/app/actions";

const input =
  "h-13 w-full rounded-2xl border border-night-line bg-night-2 px-4 text-lg font-bold text-white placeholder:text-night-text/70 focus:border-sun focus:outline-none";
const label = "text-sm font-extrabold text-white";
const primary =
  "h-14 w-full rounded-2xl bg-sun font-extrabold text-ink text-base disabled:opacity-60";

export function EnterForm() {
  const [state, action, pending] = useActionState(enterFamily, undefined);
  return (
    <form action={action} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl font-semibold">¡Hola, familia!</h1>
        <p className="text-sm font-semibold text-night-text">
          Escribe el código familiar. Solo hay que hacerlo la primera vez en este móvil.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="code" className={label}>
          Código familiar
        </label>
        <input
          id="code"
          name="code"
          autoComplete="off"
          autoCapitalize="none"
          required
          className={input}
        />
      </div>
      {state?.error && <p className="text-sm font-bold text-sun">{state.error}</p>}
      <button className={primary} disabled={pending}>
        {pending ? "Comprobando…" : "Entrar"}
      </button>
    </form>
  );
}

export function SetupForm() {
  const [state, action, pending] = useActionState(setupFamily, undefined);
  return (
    <form action={action} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl font-semibold">Vamos a empezar</h1>
        <p className="text-sm font-semibold text-night-text">
          Elige un código familiar (lo pedirá la app en cada móvil nuevo) y el PIN de 4 números del
          perfil de padres.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="code" className={label}>
          Código familiar
        </label>
        <input id="code" name="code" minLength={4} required autoComplete="off" className={input} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="pin" className={label}>
          PIN de padres (4 números)
        </label>
        <input
          id="pin"
          name="pin"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          required
          autoComplete="off"
          className={input}
        />
      </div>
      {state?.error && <p className="text-sm font-bold text-sun">{state.error}</p>}
      <button className={primary} disabled={pending}>
        {pending ? "Guardando…" : "Crear la familia"}
      </button>
    </form>
  );
}
