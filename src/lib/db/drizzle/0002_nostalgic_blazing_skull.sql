-- Step 1: Add columns as nullable
ALTER TABLE "user" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_name" text;--> statement-breakpoint

-- Step 2: Populate from existing name
UPDATE "user" SET
  "first_name" = split_part("name", ' ', 1),
  "last_name" = CASE
    WHEN position(' ' in "name") > 0
    THEN substring("name" from position(' ' in "name") + 1)
    ELSE "name"
  END;--> statement-breakpoint

-- Step 3: Make NOT NULL
ALTER TABLE "user" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "last_name" SET NOT NULL;
