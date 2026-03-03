ALTER TABLE "pipeline_stage" ALTER COLUMN "role_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "production" DROP COLUMN "stages";