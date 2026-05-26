import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const workflowInstances = sqliteTable(
  "workflow_instances",
  {
    id: text("id").primaryKey(),
    workflowKey: text("workflow_key").notNull(),
    entityTable: text("entity_table").notNull(),
    entityId: text("entity_id").notNull(),
    currentStage: text("current_stage").notNull(),
    status: text("status").notNull().default("active"),
    version: integer("version").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("workflow_instances_entity_idx").on(
      table.workflowKey,
      table.entityTable,
      table.entityId,
    ),
  ],
);

export const workflowTransitions = sqliteTable("workflow_transitions", {
  id: text("id").primaryKey(),
  workflowInstanceId: text("workflow_instance_id")
    .notNull()
    .references(() => workflowInstances.id),
  actorId: text("actor_id").notNull(),
  stage: text("stage").notNull(),
  formKey: text("form_key").notNull(),
  nextStage: text("next_stage").notNull(),
  nextStatus: text("next_status").notNull(),
  caseVersionBefore: integer("case_version_before").notNull(),
  caseVersionAfter: integer("case_version_after").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewCandidates = sqliteTable("interview_candidates", {
  id: text("id").primaryKey(),
  candidateName: text("candidate_name"),
  candidateEmail: text("candidate_email"),
  role: text("role"),
  source: text("source"),
  yearsOfExperience: integer("years_of_experience"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const interviewRound1Results = sqliteTable("interview_round1_results", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => interviewCandidates.id),
  interviewerId: text("interviewer_id").notNull(),
  score: integer("score").notNull(),
  decision: text("decision").notNull(),
  skipRound2: integer("skip_round2", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewRound2Results = sqliteTable("interview_round2_results", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => interviewCandidates.id),
  panelId: text("panel_id").notNull(),
  systemDesignScore: integer("system_design_score").notNull(),
  codingScore: integer("coding_score").notNull(),
  decision: text("decision").notNull(),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewAlternateRoundResults = sqliteTable("interview_alternate_round_results", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => interviewCandidates.id),
  reason: text("reason").notNull(),
  reviewerId: text("reviewer_id").notNull(),
  decision: text("decision").notNull(),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewHrResults = sqliteTable("interview_hr_results", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => interviewCandidates.id),
  expectedCtc: integer("expected_ctc").notNull(),
  offeredCtc: integer("offered_ctc").notNull(),
  joiningDate: text("joining_date").notNull(),
  decision: text("decision").notNull(),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewBgcResults = sqliteTable("interview_bgc_results", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => interviewCandidates.id),
  vendorReference: text("vendor_reference").notNull(),
  identityVerified: integer("identity_verified", { mode: "boolean" }).notNull(),
  employmentVerified: integer("employment_verified", { mode: "boolean" }).notNull(),
  decision: text("decision").notNull(),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewSelections = sqliteTable("interview_selections", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => interviewCandidates.id),
  employeeId: text("employee_id").notNull(),
  welcomeEmailSent: integer("welcome_email_sent", { mode: "boolean" }).notNull(),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewClosures = sqliteTable("interview_closures", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => interviewCandidates.id),
  closureReason: text("closure_reason").notNull(),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type WorkflowInstanceRow = typeof workflowInstances.$inferSelect;
export type WorkflowTransitionRow = typeof workflowTransitions.$inferSelect;
