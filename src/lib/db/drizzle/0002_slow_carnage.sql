-- Add slug columns as nullable first
ALTER TABLE "production" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "slug" text;--> statement-breakpoint

-- Backfill existing production slugs (name-based + id suffix for uniqueness)
UPDATE "production" SET "slug" =
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(LEFT(TRIM(name), 40), '[^a-z0-9]+', '-', 'gi'), '^-|-$', '', 'g'))
  || '-' || LEFT(id, 8)
WHERE "slug" IS NULL;--> statement-breakpoint

-- Backfill existing role slugs
UPDATE "role" SET "slug" =
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(LEFT(TRIM(name), 40), '[^a-z0-9]+', '-', 'gi'), '^-|-$', '', 'g'))
  || '-' || LEFT(id, 8)
WHERE "slug" IS NULL;--> statement-breakpoint

-- Make columns NOT NULL
ALTER TABLE "production" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "role" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint

-- Create composite unique indexes
CREATE UNIQUE INDEX "production_org_slug_uidx" ON "production" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "role_production_slug_uidx" ON "role" USING btree ("production_id","slug");
