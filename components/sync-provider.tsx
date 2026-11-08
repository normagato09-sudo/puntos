"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { enqueue as enqueueOp, flush, readQueue, subscribe } from "@/lib/offline/queue";
import { useBrowserOnline } from "@/lib/offline/hooks";
import type { NewOp, Op, QueueItem } from "@/lib/offline/types";

type SyncContext = {
  /** Acciones pendientes de enviar más las recién enviadas mientras llega el dato nuevo. */
  ops: Op[];
  online: boolean;
  /** Añade una acción a la cola y prueba a enviarla. Devuelve el error si el servidor la rechaza. */
  submit: (op: NewOp) => Promise<{ queued: boolean; error?: string }>;
};

const Ctx = createContext<SyncContext>({
  ops: [],
  online: true,
  submit: async () => ({ queued: false }),
});

export function useSync() {
  return useContext(Ctx);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [settling, setSettling] = useState<Op[]>([]);
  const browserOnline = useBrowserOnline();
  const [netFail, setNetFail] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const refresh = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router]);

  const runFlush = useCallback(async () => {
    const r = await flush();
    setNetFail(r.networkError);
    if (r.sent.length || r.rejected.length) {
      // Mantener lo enviado en pantalla hasta que llegue el dato del servidor.
      setSettling(r.sent);
      refresh();
    }
    return r;
  }, [refresh]);

  useEffect(() => {
    readQueue().then(setItems);
    const unsub = subscribe(setItems);

    const goOnline = () => {
      runFlush().then((r) => {
        if (!r.networkError && !r.sent.length) refresh();
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        runFlush().then((r) => {
          if (!r.networkError && !r.sent.length) refresh();
        });
      }
    };
    window.addEventListener("online", goOnline);
    document.addEventListener("visibilitychange", onVisible);
    // Al abrir la app: enviar lo pendiente y traer datos frescos.
    if (navigator.onLine) queueMicrotask(goOnline);

    // Reintento suave mientras haya algo pendiente.
    const timer = window.setInterval(async () => {
      if (navigator.onLine && (await readQueue()).length) runFlush();
    }, 20000);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    return () => {
      unsub();
      window.removeEventListener("online", goOnline);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [runFlush, refresh]);

  const submit = useCallback<SyncContext["submit"]>(
    async (input) => {
      const op = await enqueueOp(input);
      if (!navigator.onLine) return { queued: true };
      const r = await runFlush();
      const rejected = r.rejected.find((x) => x.op.id === op.id);
      if (rejected) return { queued: false, error: rejected.error };
      const pending = (await readQueue()).some((i) => i.op.id === op.id);
      return { queued: pending };
    },
    [runFlush],
  );

  const online = browserOnline && !netFail;
  const pending = items.length;
  const needsParent = items.some((i) => i.needsParent);

  const value = useMemo<SyncContext>(
    // Lo recién enviado se sigue mostrando hasta que llega el dato nuevo del servidor.
    () => ({ ops: [...items.map((i) => i.op), ...(refreshing ? settling : [])], online, submit }),
    [items, settling, refreshing, online, submit],
  );

  return (
    <Ctx.Provider value={value}>
      {(!online || pending > 0) && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[calc(6px+env(safe-area-inset-top))]"
        >
          <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-2xl bg-ink/90 px-3.5 py-1.5 text-center text-xs font-bold text-white shadow-lg">
            {!online && (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 flex-none rounded-full bg-sun" />
                Sin conexión · se enviará después
              </span>
            )}
            {pending > 0 && (
              <span className={!online ? "text-sun" : undefined}>
                {pending} {pending === 1 ? "cambio pendiente" : "cambios pendientes"}
                {online && needsParent ? " · entra como padres para enviarlos" : ""}
              </span>
            )}
          </div>
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}
