import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb, schema } from "@/db";
import type { Child, Reward, Task, TaskStatus } from "@/db/schema";
import { weekdayIndex } from "./dates";

const { child, task, taskLog, reward, dayPoint } = schema;

export type ChildWithPoints = Child & { points: number };

/**
 * Puntos = días completos (todas las tareas del día hechas y confirmadas)
 * − regalos canjeados. Nunca se guardan a mano.
 */
export async function pointsFor(childIds: number[]): Promise<Map<number, number>> {
  const result = new Map<number, number>(childIds.map((id) => [id, 0]));
  if (childIds.length === 0) return result;
  const db = await getDb();
  const earned = await db
    .select({ childId: dayPoint.childId, n: sql<number>`count(*)::int` })
    .from(dayPoint)
    .where(inArray(dayPoint.childId, childIds))
    .groupBy(dayPoint.childId);
  const spent = await db
    .select({ childId: reward.childId, n: sql<number>`coalesce(sum(${reward.approvedPrice}), 0)::int` })
    .from(reward)
    .where(and(inArray(reward.childId, childIds), eq(reward.status, "redeemed")))
    .groupBy(reward.childId);
  for (const r of earned) result.set(r.childId, (result.get(r.childId) ?? 0) + Number(r.n));
  for (const r of spent) result.set(r.childId, (result.get(r.childId) ?? 0) - Number(r.n));
  return result;
}

export async function listChildren(familyId: number): Promise<ChildWithPoints[]> {
  const db = await getDb();
  const kids = await db.select().from(child).where(eq(child.familyId, familyId)).orderBy(asc(child.id));
  const pts = await pointsFor(kids.map((k) => k.id));
  return kids.map((k) => ({ ...k, points: pts.get(k.id) ?? 0 }));
}

export async function getChild(familyId: number, childId: number): Promise<ChildWithPoints> {
  if (!Number.isInteger(childId)) notFound();
  const db = await getDb();
  const [k] = await db
    .select()
    .from(child)
    .where(and(eq(child.id, childId), eq(child.familyId, familyId)));
  if (!k) notFound();
  const pts = await pointsFor([k.id]);
  return { ...k, points: pts.get(k.id) ?? 0 };
}

export async function activeTasks(childId: number): Promise<Task[]> {
  const db = await getDb();
  return db
    .select()
    .from(task)
    .where(and(eq(task.childId, childId), eq(task.archived, false)))
    .orderBy(asc(task.id));
}

export function isScheduled(t: Task, iso: string) {
  return t.days[weekdayIndex(iso)] === "1";
}

export type DayTask = { task: Task; status: TaskStatus | null };

/** Estado de cada tarea por fecha, entre dos fechas (incluidas). */
export async function logsBetween(childId: number, from: string, to: string) {
  const db = await getDb();
  const rows = await db
    .select({ taskId: taskLog.taskId, date: taskLog.date, status: taskLog.status })
    .from(taskLog)
    .innerJoin(task, eq(task.id, taskLog.taskId))
    .where(and(eq(task.childId, childId), gte(taskLog.date, from), lte(taskLog.date, to)));
  const map = new Map<string, TaskStatus>();
  for (const r of rows) map.set(`${r.taskId}|${r.date}`, r.status as TaskStatus);
  return map;
}

/** Días (entre dos fechas) en que el hijo ganó su punto por hacerlo todo. */
export async function dayPointsBetween(childId: number, from: string, to: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ date: dayPoint.date })
    .from(dayPoint)
    .where(and(eq(dayPoint.childId, childId), gte(dayPoint.date, from), lte(dayPoint.date, to)));
  return rows.map((r) => r.date);
}

/** Total de días completos de un hijo (para su perfil). */
export async function completeDays(childId: number): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(dayPoint)
    .where(eq(dayPoint.childId, childId));
  return Number(row?.n ?? 0);
}

export function tasksForDay(tasks: Task[], logs: Map<string, TaskStatus>, iso: string): DayTask[] {
  return tasks
    .filter((t) => isScheduled(t, iso))
    .map((t) => ({ task: t, status: logs.get(`${t.id}|${iso}`) ?? null }));
}

export async function listRewards(childId: number): Promise<Reward[]> {
  const db = await getDb();
  return db.select().from(reward).where(eq(reward.childId, childId)).orderBy(desc(reward.createdAt));
}

export async function listFamilyRewards(familyId: number) {
  const db = await getDb();
  return db
    .select({ reward, childName: child.name, childColor: child.color })
    .from(reward)
    .innerJoin(child, eq(child.id, reward.childId))
    .where(eq(child.familyId, familyId))
    .orderBy(desc(reward.createdAt));
}

/** Regalos aprobados que aún no se han canjeado (salen en la tabla). */
export function openGoals(rewards: Reward[]) {
  return rewards
    .filter((r) => (r.status === "approved" || r.status === "redeem_requested") && r.approvedPrice != null)
    .sort((a, b) => (a.approvedPrice ?? 0) - (b.approvedPrice ?? 0));
}

/**
 * Meta: el regalo aprobado más cercano que todavía no alcanza; si ya alcanza
 * todos, el más caro de los que puede canjear.
 */
export function nextGoal(rewards: Reward[], points: number) {
  const goals = openGoals(rewards);
  const pending = goals.find((g) => (g.approvedPrice ?? 0) > points);
  if (pending) return { reward: pending, reached: false };
  const last = goals.at(-1);
  return last ? { reward: last, reached: true } : null;
}
