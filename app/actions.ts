"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import {
  clearParentCookie,
  createFamily,
  getFamily,
  normalizeCode,
  requireFamily,
  requireParent,
  setFamilyCookie,
  setParentCookie,
} from "@/lib/auth";
import { CHILD_COLORS, DEFAULT_TASKS } from "@/lib/constants";
import { pointsFor } from "@/lib/data";
import { ownedReward, ownedTask } from "@/lib/ops";

const { child, task, reward } = schema;

export type FormState = { error?: string; ok?: boolean } | undefined;

function refresh() {
  revalidatePath("/", "layout");
}

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/* ───────────── Entrada: código familiar y PIN ───────────── */

export async function enterFamily(_: FormState, fd: FormData): Promise<FormState> {
  const family = await getFamily();
  if (!family) redirect("/entrar");
  const code = str(fd, "code");
  if (normalizeCode(code) !== normalizeCode(family.code)) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Ese código no es correcto." };
  }
  await setFamilyCookie(family);
  redirect("/");
}

export async function setupFamily(_: FormState, fd: FormData): Promise<FormState> {
  if (await getFamily()) redirect("/entrar");
  const code = str(fd, "code");
  const pin = str(fd, "pin");
  if (code.length < 4) return { error: "El código familiar debe tener al menos 4 caracteres." };
  if (!/^\d{4}$/.test(pin)) return { error: "El PIN debe tener 4 números." };
  const family = await createFamily(code, pin);
  await setFamilyCookie(family);
  await setParentCookie(family);
  redirect("/padres/perfiles?nuevo=1");
}

export async function enterParent(pin: string): Promise<{ ok: boolean }> {
  const family = await requireFamily();
  if (pin !== family.pin) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: false };
  }
  await setParentCookie(family);
  return { ok: true };
}

export async function leaveParent() {
  await clearParentCookie();
  redirect("/");
}

/* ───────────── Perfiles ───────────── */

function validColor(c: string) {
  return CHILD_COLORS.includes(c) ? c : CHILD_COLORS[0];
}

export async function addChild(_: FormState, fd: FormData): Promise<FormState> {
  const family = await requireParent();
  const name = str(fd, "name").slice(0, 30);
  if (!name) return { error: "Escribe un nombre." };
  const db = await getDb();
  const [k] = await db
    .insert(child)
    .values({ familyId: family.id, name, color: validColor(str(fd, "color")) })
    .returning();
  await db.insert(task).values(DEFAULT_TASKS.map((n) => ({ childId: k.id, name: n, days: "1111111" })));
  refresh();
  redirect(`/padres/perfiles`);
}

export async function updateChild(childId: number, _: FormState, fd: FormData): Promise<FormState> {
  const family = await requireParent();
  const name = str(fd, "name").slice(0, 30);
  if (!name) return { error: "Escribe un nombre." };
  const db = await getDb();
  await db
    .update(child)
    .set({ name, color: validColor(str(fd, "color")) })
    .where(and(eq(child.id, childId), eq(child.familyId, family.id)));
  refresh();
  return { ok: true };
}

/* ───────────── Tareas ───────────── */

export async function addTask(childId: number, _: FormState, fd: FormData): Promise<FormState> {
  const family = await requireParent();
  const name = str(fd, "name").slice(0, 60);
  if (!name) return { error: "Escribe el nombre de la tarea." };
  const db = await getDb();
  const [k] = await db
    .select()
    .from(child)
    .where(and(eq(child.id, childId), eq(child.familyId, family.id)));
  if (!k) return { error: "No se encuentra el perfil." };
  await db.insert(task).values({ childId, name, days: "1111111" });
  refresh();
  return { ok: true };
}

export async function toggleTaskDay(taskId: number, day: number) {
  const family = await requireParent();
  const t = await ownedTask(family.id, taskId);
  if (!t || day < 0 || day > 6) return;
  const days = t.days.split("");
  days[day] = days[day] === "1" ? "0" : "1";
  const db = await getDb();
  await db.update(task).set({ days: days.join("") }).where(eq(task.id, taskId));
  refresh();
}

/** Se archiva (no se borra) para no perder los puntos ya ganados con ella. */
export async function archiveTask(taskId: number) {
  const family = await requireParent();
  const t = await ownedTask(family.id, taskId);
  if (!t) return;
  const db = await getDb();
  await db.update(task).set({ archived: true }).where(eq(task.id, taskId));
  refresh();
}

/* ───────────── Regalos ───────────── */

export async function deleteReward(rewardId: number) {
  const family = await requireFamily();
  const r = await ownedReward(family.id, rewardId);
  if (!r || (r.status !== "pending" && r.status !== "rejected")) return;
  const db = await getDb();
  await db.delete(reward).where(eq(reward.id, rewardId));
  refresh();
}

export async function requestRedeem(rewardId: number) {
  const family = await requireFamily();
  const r = await ownedReward(family.id, rewardId);
  if (!r || r.status !== "approved" || r.approvedPrice == null) return;
  const pts = (await pointsFor([r.childId])).get(r.childId) ?? 0;
  if (pts < r.approvedPrice) return;
  const db = await getDb();
  await db
    .update(reward)
    .set({ status: "redeem_requested", redeemRequestedAt: new Date() })
    .where(eq(reward.id, rewardId));
  refresh();
}

/** Los padres confirman el canje cuando entregan el regalo: se restan los puntos. */
export async function confirmRedeem(rewardId: number): Promise<{ error?: string }> {
  const family = await requireParent();
  const r = await ownedReward(family.id, rewardId);
  if (!r || r.approvedPrice == null) return {};
  if (r.status !== "redeem_requested" && r.status !== "approved") return {};
  const pts = (await pointsFor([r.childId])).get(r.childId) ?? 0;
  if (pts < r.approvedPrice) return { error: `Solo tiene ${pts} puntos; le faltan ${r.approvedPrice - pts}.` };
  const db = await getDb();
  await db
    .update(reward)
    .set({ status: "redeemed", redeemedAt: new Date() })
    .where(eq(reward.id, rewardId));
  refresh();
  return {};
}

export async function cancelRedeem(rewardId: number) {
  const family = await requireParent();
  const r = await ownedReward(family.id, rewardId);
  if (!r || r.status !== "redeem_requested") return;
  const db = await getDb();
  await db.update(reward).set({ status: "approved", redeemRequestedAt: null }).where(eq(reward.id, rewardId));
  refresh();
}

/* ───────────── Ajustes ───────────── */

export async function changePin(_: FormState, fd: FormData): Promise<FormState> {
  const family = await requireParent();
  const pin = str(fd, "pin");
  if (!/^\d{4}$/.test(pin)) return { error: "El PIN debe tener 4 números." };
  const db = await getDb();
  const [updated] = await db.update(schema.family).set({ pin }).where(eq(schema.family.id, family.id)).returning();
  await setParentCookie(updated);
  return { ok: true };
}

export async function changeFamilyCode(_: FormState, fd: FormData): Promise<FormState> {
  const family = await requireParent();
  const code = str(fd, "code");
  if (code.length < 4) return { error: "El código debe tener al menos 4 caracteres." };
  const db = await getDb();
  const [updated] = await db.update(schema.family).set({ code }).where(eq(schema.family.id, family.id)).returning();
  await setFamilyCookie(updated);
  return { ok: true };
}
