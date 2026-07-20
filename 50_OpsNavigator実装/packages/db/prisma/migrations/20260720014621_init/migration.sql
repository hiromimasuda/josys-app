-- CreateEnum
CREATE TYPE "FactStatus" AS ENUM ('CONFIRMED', 'PROPOSED', 'NEEDS_CONFIRMATION', 'CONFLICTING');

-- CreateEnum
CREATE TYPE "Risk" AS ENUM ('R0', 'R1', 'R2', 'R3');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('A0', 'A1', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_APPROVAL', 'BLOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ImpactScope" AS ENUM ('SINGLE_USER', 'TEAM', 'MULTI_TEAM', 'COMPANY', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('BEFORE', 'AFTER', 'USER_CONFIRMATION', 'APPROVAL', 'ROLLBACK_TEST', 'CHECKLIST', 'SCREENSHOT_POINTER', 'AUDIT_NOTE', 'TEST_RESULT', 'LOG_POINTER');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('OPEN', 'ACCEPTED', 'RESOLVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SourceAuthority" AS ENUM ('AUTHORITATIVE_POLICY', 'AUTHORITATIVE_RUNBOOK', 'DECISION_RECORD', 'EVIDENCE', 'BROWSE_VIEW', 'REFERENCE', 'AUDIT_ONLY');

-- CreateEnum
CREATE TYPE "Confidentiality" AS ENUM ('INTERNAL', 'RESTRICTED', 'HIGH', 'SECRET_POINTER_ONLY');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('ACTIVE', 'STALE', 'CONFLICTING', 'RETIRED');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AcceptanceResult" AS ENUM ('ACCEPTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('UPCOMING', 'DUE', 'OVERDUE', 'DONE');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILED', 'DENIED');

-- CreateTable
CREATE TABLE "DemoUser" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roles" TEXT[],
    "synthetic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DemoUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expectedOperationCount" INTEGER NOT NULL,
    "factStatus" "FactStatus" NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "operationalPriority" "CasePriority",
    "priorityFactStatus" "FactStatus" NOT NULL,
    "factStatus" "FactStatus" NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "operationIds" TEXT[],
    "initialRisk" "Risk" NOT NULL,
    "riskNote" TEXT,
    "nameFactStatus" "FactStatus" NOT NULL,
    "mappingFactStatus" "FactStatus" NOT NULL,

    CONSTRAINT "EventTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventTemplateId" TEXT,
    "operationIds" TEXT[],
    "priority" "CasePriority" NOT NULL,
    "risk" "Risk" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "impactScope" "ImpactScope" NOT NULL DEFAULT 'SINGLE_USER',
    "ongoing" BOOLEAN NOT NULL DEFAULT true,
    "recentChange" BOOLEAN NOT NULL DEFAULT false,
    "securitySignal" BOOLEAN NOT NULL DEFAULT false,
    "summarySanitized" TEXT NOT NULL DEFAULT '',
    "assigneeUserId" TEXT,
    "occurredAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "emergencyReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "factStatus" "FactStatus" NOT NULL DEFAULT 'PROPOSED',
    "demoOnly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'TODO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "risk" "Risk" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAction" TEXT NOT NULL DEFAULT '',
    "requestedFromUserId" TEXT NOT NULL,
    "requestedById" TEXT,
    "decidedById" TEXT,
    "decisionReason" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "uri" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedById" TEXT,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseException" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "fallback" TEXT NOT NULL,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "authority" "SourceAuthority" NOT NULL,
    "confidentiality" "Confidentiality" NOT NULL,
    "status" "SourceStatus" NOT NULL,
    "approvedForAi" BOOLEAN NOT NULL,
    "factStatus" "FactStatus" NOT NULL,
    "synthetic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SourceAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "sourceAssetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "trustedInstructions" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCandidate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'PENDING',
    "caseId" TEXT,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceptanceCheck" (
    "id" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "operated" BOOLEAN NOT NULL,
    "evidenceUri" TEXT,
    "result" "AcceptanceResult" NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "performedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcceptanceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorRoles" TEXT[],
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "risk" "Risk",
    "result" "AuditResult" NOT NULL,
    "reasonCode" TEXT,
    "correlationId" TEXT NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleOccurrence" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "OccurrenceStatus" NOT NULL,

    CONSTRAINT "ScheduleOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoUser_email_key" ON "DemoUser"("email");

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_eventTemplateId_fkey" FOREIGN KEY ("eventTemplateId") REFERENCES "EventTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "DemoUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "DemoUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "DemoUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseException" ADD CONSTRAINT "CaseException_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "SourceAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCandidate" ADD CONSTRAINT "KnowledgeCandidate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceCheck" ADD CONSTRAINT "AcceptanceCheck_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "DemoUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleOccurrence" ADD CONSTRAINT "ScheduleOccurrence_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
