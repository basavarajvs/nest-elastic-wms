-- Phase 11: Exception Comments & Escalation Rules
-- Creates exception_comments, exception_escalation_rules

CREATE TABLE IF NOT EXISTS "multitenant"."exception_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "exception_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "author_user_id" UUID NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "exception_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_exc_comment_exception" ON "multitenant"."exception_comments"("tenant_id", "exception_id", "created_at");
ALTER TABLE "multitenant"."exception_comments" ADD CONSTRAINT "exc_comment_exception_id_fkey" FOREIGN KEY ("exception_id") REFERENCES "multitenant"."exception_management"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "multitenant"."exception_escalation_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "rule_name" VARCHAR(100) NOT NULL,
    "exception_type" VARCHAR(50) NOT NULL,
    "severity_minimum" VARCHAR(20) NOT NULL,
    "unresolved_hours" INTEGER NOT NULL,
    "escalate_to_user_id" UUID NOT NULL,
    "notify_via_email" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "exception_escalation_rules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "escalation_rules_name_uq" ON "multitenant"."exception_escalation_rules"("tenant_id", "facility_id", "rule_name");
