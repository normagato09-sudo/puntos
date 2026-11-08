// Aplica las migraciones de db/migrations a la base de datos Neon.
// Se ejecuta en cada build de Vercel (npm run build). Si no hay
// DATABASE_URL (por ejemplo en local), no hace nada.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!url) {
  console.log("[migrate] Sin DATABASE_URL: se omiten las migraciones.");
  process.exit(0);
}

const db = drizzle(neon(url));
await migrate(db, { migrationsFolder: "./db/migrations" });
console.log("[migrate] Migraciones aplicadas.");
