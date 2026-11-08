"use client";

import { useActionState, useState } from "react";
import { addChild, updateChild } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { CHILD_COLORS } from "@/lib/constants";

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-extrabold">Color</legend>
      <div className="flex flex-wrap gap-2">
        {CHILD_COLORS.map((c) => (
          <label key={c} className="relative">
            <input
              type="radio"
              name="color"
              value={c}
              checked={value === c}
              onChange={() => onChange(c)}
              className="peer sr-only"
            />
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white ring-ink ring-offset-2 peer-checked:ring-3 peer-focus-visible:outline-3 peer-focus-visible:outline-brand"
              style={{ background: c }}
            >
              {value === c && <CheckIcon size={20} />}
            </span>
            <span className="sr-only">{c}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const input = "h-12 w-full rounded-[14px] border border-line-strong bg-white px-3.5 text-base font-bold";

export function EditChildForm({ id, name, color }: { id: number; name: string; color: string }) {
  const [state, action, pending] = useActionState(updateChild.bind(null, id), undefined);
  const [c, setC] = useState(color);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <Avatar color={c} seed={id} size={56} radius={14} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={`name-${id}`} className="text-sm font-extrabold">
            Nombre
          </label>
          <input id={`name-${id}`} name="name" defaultValue={name} required maxLength={30} className={input} />
        </div>
      </div>
      <ColorPicker value={c} onChange={setC} />
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="h-11 rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:opacity-60"
        >
          Guardar
        </button>
        {state?.ok && !pending && <span className="text-sm font-bold text-brand-dark">Guardado</span>}
        {state?.error && <span className="text-sm font-bold text-no">{state.error}</span>}
      </div>
    </form>
  );
}

export function AddChildForm({ open: initialOpen }: { open: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [state, action, pending] = useActionState(addChild, undefined);
  const [c, setC] = useState(CHILD_COLORS[0]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-dash bg-white text-[15px] font-extrabold text-muted"
      >
        <PlusIcon size={20} />
        Añadir hijo
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[20px] border-2 border-brand bg-white p-4">
      <h2 className="font-display text-xl font-semibold">Nuevo hijo</h2>
      <div className="flex items-center gap-3">
        <Avatar color={c} seed={0} size={56} radius={14} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="new-name" className="text-sm font-extrabold">
            Nombre
          </label>
          <input id="new-name" name="name" required maxLength={30} autoFocus className={input} />
        </div>
      </div>
      <ColorPicker value={c} onChange={setC} />
      <p className="text-[13px] font-semibold text-muted">
        Empezará con estas tareas: Hacer la cama, Pasear al perro, Lavarse los dientes y Ducharse (todos los
        días). Podrás cambiarlas en Tareas.
      </p>
      {state?.error && <p className="text-sm font-bold text-no">{state.error}</p>}
      <button
        disabled={pending}
        className="h-13 rounded-2xl bg-brand text-base font-extrabold text-white disabled:opacity-60"
      >
        {pending ? "Añadiendo…" : "Añadir"}
      </button>
    </form>
  );
}
