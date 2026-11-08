import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DB = NeonHttpDatabase<typeof schema>;

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

let dbPromise: Promise<DB> | undefined;

/**
 * En producción usa Neon (DATABASE_URL). En local, si no hay DATABASE_URL,
 * usa un Postgres embebido (PGlite) guardado en la carpeta .pglite.
 */
export function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (url) {
        return drizzleNeon(neon(url), { schema });
      }
      if (process.env.VERCEL) {
        throw new Error(
          "Falta DATABASE_URL. Conecta una base de datos Neon en Vercel → Storage y vuelve a desplegar.",
        );
      }
      const { PGlite } = await import("@electric-sql/pglite");
      const { drizzle } = await import("drizzle-orm/pglite");
      const { migrate } = await import("drizzle-orm/pglite/migrator");
      const client = new PGlite("./.pglite");
      const db = drizzle(client, { schema });
      await migrate(db, { migrationsFolder: "./db/migrations" });
      return db as unknown as DB;
    })();
    dbPromise.catch(() => {
      dbPromise = undefined;
    });
  }
  return dbPromise;
}

export { schema };
