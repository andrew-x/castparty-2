CREATE TYPE "public"."production_status" AS ENUM('open', 'closed', 'archive');--> statement-breakpoint
ALTER TABLE "production" ADD COLUMN "status" "production_status" DEFAULT 'closed' NOT NULL;--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "status" "production_status" DEFAULT 'closed' NOT NULL;--> statement-breakpoint
UPDATE "production" SET "status" = CASE WHEN "is_open" = true THEN 'open'::"production_status" WHEN "is_archived" = true THEN 'archive'::"production_status" ELSE 'closed'::"production_status" END;--> statement-breakpoint
UPDATE "role" SET "status" = CASE WHEN "is_open" = true THEN 'open'::"production_status" WHEN "is_archived" = true THEN 'archive'::"production_status" ELSE 'closed'::"production_status" END;--> statement-breakpoint
ALTER TABLE "production" DROP COLUMN "is_open";--> statement-breakpoint
ALTER TABLE "production" DROP COLUMN "is_archived";--> statement-breakpoint
ALTER TABLE "role" DROP COLUMN "is_open";--> statement-breakpoint
ALTER TABLE "role" DROP COLUMN "is_archived";