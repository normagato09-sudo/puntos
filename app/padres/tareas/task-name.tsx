"use client";

import { useState, useTransition } from "react";
import { renameTask } from "@/app/actions";
import { CheckIcon, PencilIcon, XIcon } from "@/components/icons";

/** Nombre de una tarea que los padres pueden cambiar (lápiz → escribir → guardar). */
export function TaskName({ id, name }: { id: number; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function save() {
    setError("");
    if (value.trim() === name) return setEditing(false);
    if (!navigator.onLine) return setError("Para cambiar el nombre hace falta conexión.");
    start(async () => {
      try {
        const r = await renameTask(id, value);
        if (r?.error) setError(r.error);
        else setEditing(false);
      } catch {
        setError("No se ha podido guardar. Prueba otra vez.");
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
        aria-label={`Cambiar el nombre de ${name}`}
        className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left text-[15px] font-extrabold"
      >
        <span className="min-w-0">{name}</span>
        <PencilIcon size={16} className="flex-none text-muted group-hover:text-brand" />
      </button>
    );
  }

  return (
    <form
      className="flex min-w-0 flex-1 flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex items-center gap-1.5">
        <label htmlFor={`task-${id}`} className="sr-only">
          Nombre de la tarea
        </label>
        <input
          id={`task-${id}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          maxLength={60}
          autoFocus
          className="h-11 min-w-0 flex-1 rounded-xl border-2 border-brand bg-white px-3 text-[15px] font-bold"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Guardar el nombre"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand text-white disabled:opacity-60"
        >
          <CheckIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Cancelar"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-muted"
        >
          <XIcon size={18} />
        </button>
      </div>
      {error && <p className="text-xs font-bold text-no">{error}</p>}
    </form>
  );
}
