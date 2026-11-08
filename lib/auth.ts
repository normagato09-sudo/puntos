import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import type { Family } from "@/db/schema";

export const FAMILY_COOKIE = "puntos_familia";
export const PARENT_COOKIE = "puntos_padres";
const PARENT_MAX_AGE = 60 * 60 * 12; // 12 horas

/**
 * Devuelve la familia (la app es para una sola familia). Si aún no existe y
 * están definidas FAMILY_CODE y PARENT_PIN, la crea con esos valores.
 */
export async function getFamily(): Promise<Family | null> {
  const db = await getDb();
  const [row] = await db.select().from(schema.family).orderBy(asc(schema.family.id)).limit(1);
  if (row) return row;

  const code = process.env.FAMILY_CODE?.trim();
  const pin = process.env.PARENT_PIN?.trim();
  if (code && pin && /^\d{4}$/.test(pin)) {
    return createFamily(code, pin);
  }
  return null;
}

export async function createFamily(code: string, pin: string): Promise<Family> {
  const db = await getDb();
  const [row] = await db
    .insert(schema.family)
    .values({ code, pin, secret: randomBytes(24).toString("hex") })
    .returning();
  return row;
}

function sign(kind: string, family: Family, value: string) {
  return createHash("sha256").update(`${kind}:${family.id}:${value}:${family.secret}`).digest("hex");
}

function safeEqual(a: string | undefined, b: string) {
  if (!a || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function familyToken(family: Family) {
  return sign("familia", family, normalizeCode(family.code));
}

export function parentToken(family: Family) {
  return sign("padres", family, family.pin);
}

export function normalizeCode(code: string) {
  return code.trim().toLowerCase();
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setFamilyCookie(family: Family) {
  (await cookies()).set(FAMILY_COOKIE, familyToken(family), {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 400,
  });
}

export async function setParentCookie(family: Family) {
  (await cookies()).set(PARENT_COOKIE, parentToken(family), {
    ...cookieBase,
    maxAge: PARENT_MAX_AGE,
  });
}

export async function clearParentCookie() {
  (await cookies()).delete(PARENT_COOKIE);
}

/** Para la API: familia con acceso (o null), sin redirigir. */
export async function familyFromCookies(): Promise<Family | null> {
  const family = await getFamily();
  if (!family) return null;
  const jar = await cookies();
  return safeEqual(jar.get(FAMILY_COOKIE)?.value, familyToken(family)) ? family : null;
}

/** Familia con acceso concedido por cookie, o redirige a la pantalla de entrada. */
export async function requireFamily(): Promise<Family> {
  const family = await getFamily();
  if (!family) redirect("/entrar");
  const jar = await cookies();
  if (!safeEqual(jar.get(FAMILY_COOKIE)?.value, familyToken(family))) redirect("/entrar");
  return family;
}

export async function isParent(family: Family): Promise<boolean> {
  const jar = await cookies();
  return safeEqual(jar.get(PARENT_COOKIE)?.value, parentToken(family));
}

/** Para páginas y acciones del panel de padres. */
export async function requireParent(): Promise<Family> {
  const family = await requireFamily();
  if (!(await isParent(family))) redirect("/?pin=1");
  return family;
}
