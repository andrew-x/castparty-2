ALTER TABLE "email" ADD COLUMN "direction" text DEFAULT 'outbound' NOT NULL;--> statement-breakpoint
ALTER TABLE "email" ADD COLUMN "from_email" text;