// 04_SEED_BUNDLE.json (JOSYS-OPS-NAV-SEED-001) の型。05_SEED_SCHEMA.json準拠。
export type FactStatus = "CONFIRMED" | "PROPOSED" | "NEEDS_CONFIRMATION" | "CONFLICTING";
export type OperationalPriority = "A0" | "A1" | "B" | "C" | "D";
export type Risk = "R0" | "R1" | "R2" | "R3";
export type CaseStatus = "OPEN" | "IN_PROGRESS" | "WAITING_APPROVAL" | "BLOCKED" | "COMPLETED";
export type RoleId =
  | "employee"
  | "operator"
  | "approver"
  | "knowledge_editor"
  | "knowledge_approver"
  | "auditor"
  | "admin"
  | "service_account";
export type SourceAuthority =
  | "AUTHORITATIVE_POLICY"
  | "AUTHORITATIVE_RUNBOOK"
  | "DECISION_RECORD"
  | "EVIDENCE"
  | "BROWSE_VIEW"
  | "REFERENCE"
  | "AUDIT_ONLY";
export type Confidentiality = "INTERNAL" | "RESTRICTED" | "HIGH" | "SECRET_POINTER_ONLY";
export type SourceStatus = "ACTIVE" | "STALE" | "CONFLICTING" | "RETIRED";
export type OccurrenceStatus = "UPCOMING" | "DUE" | "OVERDUE" | "DONE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SeedMetadata {
  bundleId: string;
  version: string;
  asOf: string;
  locale: string;
  timezone: string;
  syntheticOnly: true;
  demoOnly: true;
  productionSeedAllowed: false;
  fixedNow: string;
}

export interface Flow {
  id: string;
  name: string;
  expectedOperationCount: number;
  factStatus: FactStatus;
}

export interface Operation {
  id: string;
  name: string;
  flowId: string;
  operationalPriority: OperationalPriority | null;
  priorityFactStatus: FactStatus;
  factStatus: FactStatus;
}

export interface EventTemplate {
  id: string;
  name: string;
  operationIds: string[];
  initialRisk: Risk;
  riskNote?: string;
  nameFactStatus: FactStatus;
  mappingFactStatus: FactStatus;
}

export interface Role {
  id: RoleId;
  label: string;
  capabilities: string[];
}

export interface MockUser {
  id: string;
  displayName: string;
  email: string;
  roleIds: RoleId[];
  synthetic: true;
}

export interface DemoCase {
  id: string;
  title: string;
  eventTemplateId: string;
  operationIds: string[];
  operationalPriority: OperationalPriority;
  risk: Risk;
  status: CaseStatus;
  assigneeUserId: string;
  dueAt: string;
  demoOnly: true;
  factStatus: FactStatus;
}

export interface SourceAsset {
  id: string;
  title: string;
  uri: string;
  authority: SourceAuthority;
  confidentiality: Confidentiality;
  status: SourceStatus;
  approvedForAi: boolean;
  synthetic: true;
  factStatus: FactStatus;
}

export interface KnowledgeDocument {
  id: string;
  sourceAssetId: string;
  title: string;
  content: string;
  trustedInstructions: false;
  searchable: boolean;
  synthetic: true;
}

export interface ScheduleOccurrence {
  id: string;
  operationId: string;
  title: string;
  startsAt: string;
  dueAt: string;
  status: OccurrenceStatus;
  demoOnly: true;
}

export interface Approval {
  id: string;
  caseId: string;
  risk: Risk;
  status: ApprovalStatus;
  requestedFromUserId: string;
  demoOnly: true;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  kind: "CHECKLIST" | "SCREENSHOT_POINTER" | "AUDIT_NOTE" | "TEST_RESULT";
  uri: string;
  capturedAt: string;
  demoOnly: true;
}

export interface ExceptionItem {
  id: string;
  caseId: string;
  reason: string;
  ownerUserId: string;
  dueAt: string;
  nextReviewAt: string;
  fallback: string;
  status: "OPEN" | "RESOLVED";
  demoOnly: true;
}

export interface AiMockResponse {
  id: string;
  scenario: string;
  internalAnswerStatus: "FOUND" | "NOT_FOUND" | "CONFLICTING" | "NOT_AUTHORIZED";
  internalAnswer: string;
  generalGuidance: string;
  citationSourceIds: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  escalationRequired: boolean;
  actionExecutionAllowed: false;
  demoOnly: true;
}

export interface SeedBundle {
  metadata: SeedMetadata;
  flows: Flow[];
  operations: Operation[];
  eventTemplates: EventTemplate[];
  roles: Role[];
  mockUsers: MockUser[];
  demoCases: DemoCase[];
  sourceAssets: SourceAsset[];
  knowledgeDocuments: KnowledgeDocument[];
  scheduleOccurrences: ScheduleOccurrence[];
  approvals: Approval[];
  evidence: EvidenceItem[];
  exceptions: ExceptionItem[];
  aiMockResponses: AiMockResponse[];
}
