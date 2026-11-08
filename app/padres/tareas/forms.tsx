"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTask, changeFamilyCode, changePin } from "@/app/actions";
import { PlusIcon } from "@/components/icons";

export function NewTaskForm({ childId }: { childId: number }) {
  const [state, action, pending] = useActionState(addTask.bind(null, childId), undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form
      ref={ref}
      action={action}
      className="flex flex-col gap-1.5 rounded-2xl border-2 border-dashed border-dash bg-white p-2.5"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="nueva" className="sr-only">
          Nueva tarea
        </label>
        <input
          id="nueva"
          name="name"
          required
          maxLength={60}
          placeholder="Nueva tarea, p. ej. Recoger los juguetes"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-cream px-3 text-sm font-semibold text-ink"
        />
        <button
          disabled={pending}
          className="flex h-11 items-center gap-1 rounded-xl bg-brand px-3.5 text-sm font-extrabold text-white disabled:opacity-60"
        >
          <PlusIcon size={16} strokeWidth={2.6} />
          Añadir
        </button>
      </div>
      {state?.error && <p className="px-1 text-xs font-bold text-no">{state.error}</p>}
    </form>
  );
}

function SettingForm({
  label,
  name,
  action,
  numeric,
  okText,
}: {
  label: string;
  name: string;
  action: typeof changePin;
  numeric?: boolean;
  okText: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-3.5">
      <label htmlFor={name} className="text-sm font-extrabold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={name}
          name={name}
          required
          autoComplete="off"
          {...(numeric ? { inputMode: "numeric", pattern: "\\d{4}", maxLength: 4 } : { minLength: 4 })}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-cream px-3 text-[15px] font-bold"
        />
        <button
          disabled={pending}
          className="h-11 rounded-xl bg-ink px-4 text-sm font-extrabold text-white disabled:opacity-60"
        >
          Guardar
        </button>
      </div>
      {state?.error && <p className="text-xs font-bold text-no">{state.error}</p>}
      {state?.ok && <p className="text-xs font-bold text-brand-dark">{okText}</p>}
    </form>
  );
}

export function SettingsForms() {
  return (
    <>
      <SettingForm label="Nuevo PIN de padres (4 números)" name="pin" action={changePin} numeric okText="PIN cambiado." />
      <SettingForm
        label="Nuevo código familiar"
        name="code"
        action={changeFamilyCode}
        okText="Código cambiado. Los otros móviles tendrán que escribirlo otra vez."
      />
    </>
  );
}
