CREATE TABLE "day_point" (
	"child_id" integer NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_point_child_id_date_pk" PRIMARY KEY("child_id","date")
);
--> statement-breakpoint
ALTER TABLE "day_point" ADD CONSTRAINT "day_point_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Días ya completos con los datos existentes: todas las tareas activas que tocaban ese día, hechas.
INSERT INTO "day_point" ("child_id", "date")
SELECT d.child_id, d.date
FROM (SELECT DISTINCT t.child_id, l.date FROM "task_log" l JOIN "task" t ON t.id = l.task_id) d
JOIN "task" t ON t.child_id = d.child_id AND t.archived = false
  AND substring(t.days, extract(isodow FROM d.date::date)::int, 1) = '1'
LEFT JOIN "task_log" l ON l.task_id = t.id AND l.date = d.date
GROUP BY d.child_id, d.date
HAVING count(*) > 0 AND bool_and(coalesce(l.status = 'done', false))
ON CONFLICT DO NOTHING;
