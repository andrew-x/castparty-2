ALTER TABLE "pipeline_stage" DROP CONSTRAINT "pipeline_stage_role_id_role_id_fk";
--> statement-breakpoint
ALTER TABLE "pipeline_stage" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "role" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "role" DROP COLUMN "submission_form_fields";--> statement-breakpoint
ALTER TABLE "role" DROP COLUMN "system_field_config";--> statement-breakpoint
ALTER TABLE "role" DROP COLUMN "feedback_form_fields";--> statement-breakpoint
ALTER TABLE "role" DROP COLUMN "reject_reasons";