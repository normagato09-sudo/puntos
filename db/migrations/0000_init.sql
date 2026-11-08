CREATE TABLE "child" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"pin" text NOT NULL,
	"secret" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"name" text NOT NULL,
	"child_price" integer,
	"link" text,
	"photo" text,
	"approved_price" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"redeem_requested_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"name" text NOT NULL,
	"days" text DEFAULT '1111111' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"date" text NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "child" ADD CONSTRAINT "child_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward" ADD CONSTRAINT "reward_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_log" ADD CONSTRAINT "task_log_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reward_child_idx" ON "reward" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "task_child_idx" ON "task" USING btree ("child_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_log_task_date_idx" ON "task_log" USING btree ("task_id","date");