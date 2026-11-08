import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

/** Regalos que esperan a los padres (por aprobar o por entregar), para el aviso del menú. */
export async function pendingRewardCount(familyId: number) {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.reward)
    .innerJoin(schema.child, eq(schema.child.id, schema.reward.childId))
    .where(
      and(
        eq(schema.child.familyId, familyId),
        inArray(schema.reward.status, ["pending", "redeem_requested"]),
      ),
    );
  return Number(row?.n ?? 0);
}
