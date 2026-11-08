"use client";

import { useState } from "react";

/** Enlace externo (p. ej. la tienda) que avisa si no hay conexión en vez de fallar. */
export function OnlineLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-col gap-1.5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={className}
        onClick={(e) => {
          if (!navigator.onLine) {
            e.preventDefault();
            setMsg("Sin conexión: para ver la tienda hace falta internet.");
          }
        }}
      >
        {children}
      </a>
      {msg && (
        <p role="alert" className="text-center text-[13px] font-bold text-no">
          {msg}
        </p>
      )}
    </div>
  );
}
