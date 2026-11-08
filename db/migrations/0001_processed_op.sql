CREATE TABLE "processed_op" (
	"id" text PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "processed_op" ADD CONSTRAINT "processed_op_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;