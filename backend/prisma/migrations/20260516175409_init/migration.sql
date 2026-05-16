-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REWORK');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('PENDING', 'ON_TRACK', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UomType" AS ENUM ('PERCENTAGE', 'NUMBER', 'CURRENCY', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "ScoringType" AS ENUM ('MAX', 'MIN', 'TIMELINE', 'ZERO');

-- CreateEnum
CREATE TYPE "Period" AS ENUM ('GOAL_SETTING', 'Q1', 'Q2', 'Q3', 'Q4');

-- CreateEnum
CREATE TYPE "Quarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "manager_id" TEXT,
    "azure_oid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_sheets" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "cycle_year" INTEGER NOT NULL,
    "status" "SheetStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "thrust_area" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "uom_type" "UomType" NOT NULL,
    "scoring_type" "ScoringType" NOT NULL DEFAULT 'MAX',
    "target" DOUBLE PRECISION NOT NULL,
    "deadline" TIMESTAMP(3),
    "weightage" DOUBLE PRECISION NOT NULL,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "shared_owner_id" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_actuals" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "actual_value" DOUBLE PRECISION NOT NULL,
    "completed_date" TIMESTAMP(3),
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_actuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_config" (
    "id" TEXT NOT NULL,
    "cycle_year" INTEGER NOT NULL,
    "goal_setting_start" INTEGER NOT NULL DEFAULT 1,
    "q1_start" INTEGER NOT NULL DEFAULT 1,
    "q2_start" INTEGER NOT NULL DEFAULT 4,
    "q3_start" INTEGER NOT NULL DEFAULT 7,
    "q4_start" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_comments" (
    "id" TEXT NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkin_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'UPDATE',
    "changed_by" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_unlocks" (
    "id" TEXT NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "granted_by" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "threshold_days" INTEGER NOT NULL,
    "notify_role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_log" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',

    CONSTRAINT "escalation_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_azure_oid_key" ON "users"("azure_oid");

-- CreateIndex
CREATE UNIQUE INDEX "goal_sheets_employee_id_cycle_year_key" ON "goal_sheets"("employee_id", "cycle_year");

-- CreateIndex
CREATE UNIQUE INDEX "goal_actuals_goal_id_quarter_key" ON "goal_actuals"("goal_id", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_config_cycle_year_key" ON "cycle_config"("cycle_year");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_changed_at_idx" ON "audit_log"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "escalation_rules_name_key" ON "escalation_rules"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_sheets" ADD CONSTRAINT "goal_sheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "goal_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_shared_owner_id_fkey" FOREIGN KEY ("shared_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_actuals" ADD CONSTRAINT "goal_actuals_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_comments" ADD CONSTRAINT "checkin_comments_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "goal_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_comments" ADD CONSTRAINT "checkin_comments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_unlocks" ADD CONSTRAINT "goal_unlocks_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "goal_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_unlocks" ADD CONSTRAINT "goal_unlocks_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_log" ADD CONSTRAINT "escalation_log_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "escalation_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_log" ADD CONSTRAINT "escalation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
