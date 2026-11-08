import { familyFromCookies, isParent } from "@/lib/auth";
import { applyOp } from "@/lib/ops";

export const dynamic = "force-dynamic";

/** Recibe una acción de la cola local (hecha con o sin conexión) y la aplica una sola vez. */
export async function POST(req: Request) {
  const family = await familyFromCookies();
  if (!family) return Response.json({ ok: false, error: "Falta el código familiar." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Acción no válida." }, { status: 400 });
  }

  const out = await applyOp(family, await isParent(family), body);
  return Response.json(out.body, { status: out.status, headers: { "cache-control": "no-store" } });
}
