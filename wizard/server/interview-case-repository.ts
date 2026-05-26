import { ensureWorkflowInstance, getWorkflowInstance, submitWorkflowStage } from "./workflow-runtime";
import { interviewWorkflowServerConfig } from "./interview-workflow-server";
import { db } from "../db/client";
import { interviewCandidates } from "../db/schema";
import { eq } from "drizzle-orm";

export function getInterviewCaseWorkflow(candidateId: string) {
  return getWorkflowInstance(interviewWorkflowServerConfig, candidateId);
}

export function ensureInterviewCaseWorkflow(candidateId: string) {
  ensureInterviewCandidate(candidateId);
  return ensureWorkflowInstance(interviewWorkflowServerConfig, candidateId);
}

export function submitInterviewStage(input: {
  candidateId: string;
  expectedVersion: number;
  actorId: string;
  stage: string;
  formKey: string;
  payload: unknown;
}) {
  return submitWorkflowStage(interviewWorkflowServerConfig, {
    workflowKey: interviewWorkflowServerConfig.key,
    entityId: input.candidateId,
    expectedVersion: input.expectedVersion,
    actorId: input.actorId,
    stage: input.stage,
    formKey: input.formKey,
    payload: input.payload,
  });
}

function ensureInterviewCandidate(candidateId: string) {
  const existing = db
    .select({ id: interviewCandidates.id })
    .from(interviewCandidates)
    .where(eq(interviewCandidates.id, candidateId))
    .get();

  if (existing) {
    return;
  }

  const now = new Date();

  db.insert(interviewCandidates)
    .values({
      id: candidateId,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}
