CREATE TABLE "pipeline_stage" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_change" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"from_stage_id" text,
	"to_stage_id" text,
	"changed_by_id" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "stage_id" text;--> statement-breakpoint
ALTER TABLE "pipeline_stage" ADD CONSTRAINT "pipeline_stage_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change" ADD CONSTRAINT "status_change_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change" ADD CONSTRAINT "status_change_from_stage_id_pipeline_stage_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."pipeline_stage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change" ADD CONSTRAINT "status_change_to_stage_id_pipeline_stage_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."pipeline_stage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change" ADD CONSTRAINT "status_change_changed_by_id_user_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pipeline_stage_role_id_idx" ON "pipeline_stage" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pipeline_stage_role_slug_uidx" ON "pipeline_stage" USING btree ("role_id","slug");--> statement-breakpoint
CREATE INDEX "status_change_submission_id_idx" ON "status_change" USING btree ("submission_id");--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_stage_id_pipeline_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stage"("id") ON DELETE set null ON UPDATE no action;