import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Family, TaskStatus } from "@/db/schema";
import type { Op, OpResult } from "@/lib/offline/types";
import { PARENT_OPS } from "@/lib/offline/types";
import { addDays, isISODate, todayISO } from "./dates";

const { child, task, taskLog, reward, processedOp } = schema;

export async function ownedTask(familyId: number, taskId: number) {
  const db = await getDb();
  const [row] = await db
    .select({ task })
    .from(task)
    .innerJoin(child, eq(child.id, task.childId))
    .where(and(eq(task.id, taskId), eq(child.familyId, familyId)));
  return row?.task ?? null;
}

export async function ownedReward(familyId: number, rewardId: number) {
  const db = await getDb();
  const [row] = await db
    .select({ reward })
    .from(reward)
    .innerJoin(child, eq(child.id, reward.childId))
    .where(and(eq(reward.id, rewardId), eq(child.familyId, familyId)));
  return row?.reward ?? null;
}

export async function setLog(taskId: number, date: string, status: TaskStatus | null) {
  const db = await getDb();
  if (status === null) {
    await db.delete(taskLog).where(and(eq(taskLog.taskId, taskId), eq(taskLog.date, date)));
    return;
  }
  await db
    .insert(taskLog)
    .values({ taskId, date, status })
    .onConflictDoUpdate({ target: [taskLog.taskId, taskLog.date], set: { status, updatedAt: new Date() } });
}

export type WishFields = { name: string; price: number | null; link: string | null; photo: string | null };

/** Valida y normaliza un regalo pedido por un hijo. */
export function cleanWish(raw: {
  name?: unknown;
  price?: unknown;
  link?: unknown;
  photo?: unknown;
}): WishFields | { error: string } {
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 80) : "";
  if (!name) return { error: "Escribe qué regalo te gustaría." };
  let price: number | null = null;
  if (raw.price !== null && raw.price !== undefined && raw.price !== "") {
    price = Math.round(Number(String(raw.price).replace(",", ".")));
    if (!Number.isFinite(price) || price < 0 || price > 10000) return { error: "El precio no parece correcto." };
  }
  let link = typeof raw.link === "string" ? raw.link.trim().slice(0, 1000) : "";
  if (link && !/^https?:\/\//i.test(link)) link = "https://" + link;
  if (link) {
    try {
      new URL(link);
    } catch {
      return { error: "El enlace no parece correcto." };
    }
  }
  const photo = typeof raw.photo === "string" ? raw.photo : "";
  if (photo && (!photo.startsWith("data:image/") || photo.length > 1_200_000)) {
    return { error: "La foto es demasiado grande." };
  }
  return { name, price, link: link || null, photo: photo || null };
}

type Outcome = { status: number; body: OpResult };
const ok = (): Outcome => ({ status: 200, body: { ok: true } });
const fail = (status: number, error: string): Outcome => ({ status, body: { ok: false, error } });

function isOp(x: unknown): x is Op {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    /^[A-Za-z0-9-]{8,64}$/.test(o.id) &&
    typeof o.type === "string" &&
    Number.isInteger(o.childId)
  );
}

/**
 * Aplica una acción de la cola. Idempotente: si el id ya se procesó, no hace nada.
 * Si hay conflicto, manda el estado del servidor.
 */
export async function applyOp(family: Family, parent: boolean, raw: unknown): Promise<Outcome> {
  if (!isOp(raw)) return fail(400, "Acción no válida.");
  const op = raw;
  if (PARENT_OPS.includes(op.type) && !parent) return fail(401, "Hace falta el PIN de padres.");

  const db = await getDb();
  const [k] = await db
    .select()
    .from(child)
    .where(and(eq(child.id, op.childId), eq(child.familyId, family.id)));
  if (!k) return fail(422, "No se encuentra el perfil.");

  // Reservar el id: si ya existía, la acción ya se aplicó antes.
  const inserted = await db
    .insert(processedOp)
    .values({ id: op.id, familyId: family.id, type: op.type })
    .onConflictDoNothing()
    .returning({ id: processedOp.id });
  if (inserted.length === 0) return { status: 200, body: { ok: true, duplicate: true } };

  try {
    const out = await run(family, op);
    if (out.status !== 200) await db.delete(processedOp).where(eq(processedOp.id, op.id));
    return out;
  } catch (e) {
    await db.delete(processedOp).where(eq(processedOp.id, op.id));
    throw e;
  }
}

async function run(family: Family, op: Op): Promise<Outcome> {
  const db = await getDb();
  const today = todayISO();

  switch (op.type) {
    case "kid.done": {
      // Vale para hoy o para días recientes (si se marcó sin conexión).
      if (!isISODate(op.date) || op.date > today || op.date < addDays(today, -7)) {
        return fail(422, "Ese día ya no se puede marcar.");
      }
      const t = await ownedTask(family.id, op.taskId);
      if (!t || t.childId !== op.childId || t.archived) return fail(422, "Esa tarea ya no existe.");
      // Solo si nadie la ha marcado todavía: si los padres ya decidieron, manda lo suyo.
      await db.insert(taskLog).values({ taskId: t.id, date: op.date, status: "waiting" }).onConflictDoNothing();
      return ok();
    }

    case "parent.task": {
      if (!isISODate(op.date) || op.date > today) return fail(422, "Ese día todavía no ha llegado.");
      if (op.status !== null && op.status !== "done" && op.status !== "missed") return fail(400, "Estado no válido.");
      const t = await ownedTask(family.id, op.taskId);
      if (!t || t.childId !== op.childId) return fail(422, "Esa tarea ya no existe.");
      await setLog(t.id, op.date, op.status);
      return ok();
    }

    case "kid.wish": {
      const w = cleanWish(op);
      if ("error" in w) return fail(422, w.error);
      await db.insert(reward).values({
        childId: op.childId,
        name: w.name,
        childPrice: w.price,
        link: w.link,
        photo: w.photo,
        status: "pending",
      });
      return ok();
    }

    case "parent.reward": {
      const r = await ownedReward(family.id, op.rewardId);
      if (!r || r.childId !== op.childId) return fail(422, "Ese regalo ya no existe.");
      if (r.status === "redeemed" || r.status === "redeem_requested") {
        return fail(409, "Ese regalo ya se está canjeando; no se ha cambiado.");
      }
      if (op.decision === "approve") {
        const p = Math.round(Number(op.price));
        if (!Number.isFinite(p) || p < 1 || p > 10000) return fail(422, "El precio no es válido.");
        await db
          .update(reward)
          .set({ status: "approved", approvedPrice: p, approvedAt: new Date() })
          .where(eq(reward.id, r.id));
      } else {
        await db.update(reward).set({ status: "rejected" }).where(eq(reward.id, r.id));
      }
      return ok();
    }

    default:
      return fail(400, "Acción desconocida.");
  }
}
