import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { child, reward, task, taskLog } from "@/db/schema";
import { todayISO, weekdayIndex } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Aviso de la tarde a Mi Oficina (agente `puntos-diario`). Lo llama Vercel Cron a las 20:00 (ver vercel.json).
 * Mira las tareas que tocan hoy: si a alguien le quedan sin marcar, avisa con cuáles (notificación).
 * Si todo está marcado, no molesta. También avisa de premios que esperan que los padres los entreguen.
 * Variables: MI_OFICINA_URL y MI_OFICINA_CLAVE (sin ellas no se envía nada). Con CRON_SECRET, solo Vercel puede llamarlo.
 */
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No permitido" }, { status: 401 });
  }
  const base = process.env.MI_OFICINA_URL;
  const clave = process.env.MI_OFICINA_CLAVE;
  if (!base || !clave) return Response.json({ ok: true, nota: "Mi Oficina sin configurar" });

  const db = await getDb();
  const hoy = todayISO();
  const dia = weekdayIndex(hoy);

  const hijos = await db.select().from(child);
  const tareas = (await db.select().from(task).where(eq(task.archived, false))).filter((t) => t.days[dia] === "1");
  const registros = tareas.length
    ? await db.select().from(taskLog).where(and(eq(taskLog.date, hoy), inArray(taskLog.taskId, tareas.map((t) => t.id))))
    : [];
  const marcadas = new Set(registros.map((r) => r.taskId));

  const lineas: string[] = [];
  for (const h of hijos) {
    const suyas = tareas.filter((t) => t.childId === h.id);
    const faltan = suyas.filter((t) => !marcadas.has(t.id));
    if (faltan.length) lineas.push(`• ${h.name}: falta${faltan.length > 1 ? "n" : ""} ${faltan.map((t) => t.name).join(", ")}`);
  }

  const premios = await db.select({ nombre: reward.name, hijo: reward.childId }).from(reward).where(eq(reward.status, "redeem_requested"));
  const nombreHijo = new Map(hijos.map((h) => [h.id, h.name]));

  const enviar = (nivel: string, titulo: string, texto: string) =>
    fetch(`${base.replace(/\/$/, "")}/api/eventos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${clave}` },
      body: JSON.stringify({ agente: "puntos-diario", nivel, titulo, texto }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});

  if (lineas.length) {
    await enviar("importante", "Toca marcar en Puntos lo que has hecho hoy", [...lineas, "Entra en Puntos y márcalas antes de dormir."].join("\n"));
  }
  if (premios.length) {
    await enviar(
      "normal",
      `${premios.length} ${premios.length === 1 ? "premio espera" : "premios esperan"} a que lo entreguéis`,
      premios.map((p) => `• ${p.nombre} (${nombreHijo.get(p.hijo) ?? "—"})`).join("\n"),
    );
  }
  return Response.json({ ok: true, faltan: lineas.length, premios: premios.length });
}
