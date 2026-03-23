ALTER TABLE "production" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;