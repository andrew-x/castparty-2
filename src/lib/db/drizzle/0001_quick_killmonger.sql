CREATE TABLE "submission" (
	"id" text PRIMARY KEY NOT NULL,
	"production_id" text NOT NULL,
	"role_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"resume_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate" ADD COLUMN "first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate" ADD COLUMN "last_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_production_id_production_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."production"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_candidate_id_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("id") ON DELETE cascade ON UPDATE no action;