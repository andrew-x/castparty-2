ALTER TABLE "production" ADD COLUMN "reject_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "reject_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "rejection_reason" text;