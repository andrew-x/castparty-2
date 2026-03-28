ALTER TABLE "email" ADD COLUMN "resend_email_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "email_resendEmailId_idx" ON "email" USING btree ("resend_email_id");