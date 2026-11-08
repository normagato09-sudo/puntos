# Puntos

App familiar: los hijos hacen tareas de casa, ganan puntos (1 tarea = 1 punto = 1 €) y los
canjean por regalos que ellos mismos piden. Pensada para el móvil.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · Postgres en Neon · Drizzle ORM.

## Variables de entorno

| Variable | Obligatoria | Qué es |
| --- | --- | --- |
| `DATABASE_URL` | Sí (en Vercel) | Cadena de conexión de Neon. La crea Vercel al conectar Neon desde **Storage**. También vale `POSTGRES_URL`. |
| `FAMILY_CODE` | No | Código familiar inicial. Si no la pones, la app lo pide la primera vez que se abre. |
| `PARENT_PIN` | No | PIN inicial de padres (4 números). Igual que la anterior. |
| `APP_TIMEZONE` | No | Zona horaria para saber qué día es "hoy". Por defecto `Europe/Madrid`. |

El código familiar y el PIN se guardan en la base de datos y se pueden cambiar desde
**Padres → Tareas → Ajustes**. `FAMILY_CODE` y `PARENT_PIN` solo se usan para crear la
familia si todavía no existe.

## Crear la base de datos Neon desde Vercel

1. Abre el proyecto en Vercel → pestaña **Storage** → **Create Database**.
2. Elige **Neon** (Serverless Postgres), plan gratuito, región Frankfurt (`fra1`) o la más cercana.
3. Conéctala al proyecto `puntos` marcando los entornos **Production** y **Preview**.
   Vercel añade sola la variable `DATABASE_URL`.
4. Vuelve a desplegar (Deployments → ⋯ → **Redeploy**). En cada build se ejecutan las
   migraciones (`scripts/migrate.mjs`), así que las tablas se crean solas.

## Desarrollo en local

```bash
npm install
npm run dev
```

Sin `DATABASE_URL`, la app usa un Postgres embebido (PGlite) guardado en `.pglite/`, así que
funciona sin configurar nada. Para usar Neon en local, crea `.env.local` con `DATABASE_URL=...`
y ejecuta `npm run db:migrate`.

Si cambias `db/schema.ts`, genera la migración con `npm run db:generate` y haz commit de la
carpeta `db/migrations`.

## Reglas

- Cada tarea confirmada por los padres = 1 punto. Las no hechas no restan.
- Puntos de un hijo = tareas confirmadas − regalos canjeados (se calcula, no se guarda).
- Un regalo aprobado sale en la casilla de su precio en la tabla del 1 al 100.
- Al canjear, el hijo pide el regalo y los padres confirman cuando lo entregan: ahí se restan los puntos.
- Las tareas borradas se archivan para no perder los puntos que ya dieron.
