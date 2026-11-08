// Cola local de acciones pendientes de enviar, guardada en IndexedDB.
// Se envían en orden a POST /api/ops; cada acción lleva un id único.

import { idbGet, idbSet } from "./idb";
import { PARENT_OPS, type NewOp, type Op, type OpResult, type QueueItem } from "./types";

const KEY = "queue";
const CHANNEL = "puntos-sync";
type Listener = (items: QueueItem[]) => void;
const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

function getChannel() {
  if (!channel && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = async () => emit(await readQueue());
  }
  return channel;
}

function emit(items: QueueItem[]) {
  for (const l of listeners) l(items);
}

export async function readQueue(): Promise<QueueItem[]> {
  return (await idbGet<QueueItem[]>(KEY)) ?? [];
}

// Escrituras en serie para no pisarnos dentro de la misma pestaña.
let writeChain: Promise<unknown> = Promise.resolve();
function update(fn: (items: QueueItem[]) => QueueItem[]): Promise<QueueItem[]> {
  const next = writeChain.then(async () => {
    const items = fn(await readQueue());
    await idbSet(KEY, items);
    emit(items);
    getChannel()?.postMessage("changed");
    return items;
  });
  writeChain = next.catch(() => undefined);
  return next;
}

export function subscribe(l: Listener) {
  listeners.add(l);
  getChannel();
  return () => {
    listeners.delete(l);
  };
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function enqueue(input: NewOp): Promise<Op> {
  const op = { ...input, id: newId(), at: Date.now() } as Op;
  await update((items) => [...items, { op }]);
  return op;
}

export type FlushResult = {
  sent: Op[];
  rejected: { op: Op; error: string }[];
  networkError: boolean;
  needsParent: boolean;
};

let chain: Promise<unknown> = Promise.resolve();

/**
 * Envía las acciones pendientes en orden. Se para si no hay conexión.
 * Los envíos van en fila: si ya hay uno en marcha, este empieza al terminar
 * (y lee la cola de nuevo, así incluye lo recién añadido sin repetir lo enviado).
 */
export function flush(): Promise<FlushResult> {
  const next = chain.then(doFlush, doFlush);
  chain = next.catch(() => undefined);
  return next;
}

async function doFlush(): Promise<FlushResult> {
  const result: FlushResult = { sent: [], rejected: [], networkError: false, needsParent: false };
  const items = await readQueue();
  let parentBlocked = false;

  for (const item of items) {
    const { op } = item;
    const isParentOp = PARENT_OPS.includes(op.type);
    // Si falta el PIN de padres, las acciones de padres esperan (en su orden);
    // las de los hijos siguen enviándose.
    if (isParentOp && parentBlocked) continue;

    let res: Response;
    try {
      res = await fetch("/api/ops", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(op),
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      result.networkError = true;
      break;
    }

    if (res.status === 401) {
      if (isParentOp) {
        parentBlocked = true;
        result.needsParent = true;
        await update((q) => q.map((i) => (i.op.id === op.id ? { ...i, needsParent: true } : i)));
        continue;
      }
      // Sin código familiar: no se puede enviar nada.
      result.networkError = true;
      break;
    }
    if (res.status >= 500 || res.status === 0) {
      result.networkError = true;
      break;
    }

    let body: OpResult | null = null;
    try {
      body = (await res.json()) as OpResult;
    } catch {
      body = null;
    }
    await update((q) => q.filter((i) => i.op.id !== op.id));
    if (res.ok && body?.ok) result.sent.push(op);
    else result.rejected.push({ op, error: (body && !body.ok && body.error) || "No se ha podido guardar." });
  }
  return result;
}
