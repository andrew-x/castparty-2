CREATE TYPE "public"."file_type" AS ENUM('HEADSHOT', 'RESUME', 'VIDEO');--> statement-breakpoint
CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text,
	"candidate_id" text,
	"type" "file_type" NOT NULL,
	"url" text NOT NULL,
	"key" text NOT NULL,
	"path" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_candidate_id_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "file_submissionId_idx" ON "file" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "file_candidateId_idx" ON "file" USING btree ("candidate_id");