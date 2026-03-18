CREATE TABLE "comment" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"submitted_by_user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_submitted_by_user_id_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_submissionId_idx" ON "comment" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "comment_submittedByUserId_idx" ON "comment" USING btree ("submitted_by_user_id");