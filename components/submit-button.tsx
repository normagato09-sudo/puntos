"use client";

import { useFormStatus } from "react-dom";

/** Botón de formulario que se atenúa mientras la acción del servidor trabaja. */
export function SubmitButton({
  children,
  className = "",
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${className} transition-opacity ${pending ? "opacity-60" : ""} disabled:cursor-default`}
    >
      {children}
    </button>
  );
}
