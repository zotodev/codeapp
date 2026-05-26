import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  interviewAlternateRoundResults,
  interviewBgcResults,
  interviewCandidates,
  interviewClosures,
  interviewHrResults,
  interviewRound1Results,
  interviewRound2Results,
  interviewSelections,
} from "../db/schema";
import { interviewWorkflowConfig, type InterviewContext } from "../domain/interview-workflow";
import type { WorkflowConfig } from "../domain/workflow-types";

type WritableTx = Pick<typeof db, "insert" | "update">;

export const interviewWorkflowServerConfig = {
  ...interviewWorkflowConfig,
  resolveContext: (candidateId: string): InterviewContext => {
    const candidate = db
      .select()
      .from(interviewCandidates)
      .where(eq(interviewCandidates.id, candidateId))
      .get();

    return {
      candidateId,
      candidateName: candidate?.candidateName ?? null,
      candidateEmail: candidate?.candidateEmail ?? null,
      role: candidate?.role ?? null,
    };
  },
  saveForm: ({ tx, formKey, payload, submitContext }) => {
    const database = tx as WritableTx;
    const now = new Date();
    const candidateId = submitContext.entityId;

    switch (formKey) {
      case "candidate_basic_details":
        database
          .update(interviewCandidates)
          .set({
            candidateName: payload.candidateName as string,
            candidateEmail: payload.candidateEmail as string,
            role: payload.role as string,
            source: payload.source as string,
            yearsOfExperience: payload.yearsOfExperience as number,
            updatedAt: now,
          })
          .where(eq(interviewCandidates.id, candidateId))
          .run();
        return;
      case "round1_feedback":
        database.insert(interviewRound1Results).values({
          id: randomUUID(),
          candidateId,
          interviewerId: payload.interviewerId as string,
          score: payload.score as number,
          decision: payload.decision as string,
          skipRound2: payload.skipRound2 as boolean,
          notes: payload.notes as string,
          createdAt: now,
        }).run();
        return;
      case "round2_feedback":
        database.insert(interviewRound2Results).values({
          id: randomUUID(),
          candidateId,
          panelId: payload.panelId as string,
          systemDesignScore: payload.systemDesignScore as number,
          codingScore: payload.codingScore as number,
          decision: payload.decision as string,
          notes: payload.notes as string,
          createdAt: now,
        }).run();
        return;
      case "alternate_round_feedback":
        database.insert(interviewAlternateRoundResults).values({
          id: randomUUID(),
          candidateId,
          reason: payload.reason as string,
          reviewerId: payload.reviewerId as string,
          decision: payload.decision as string,
          notes: payload.notes as string,
          createdAt: now,
        }).run();
        return;
      case "hr_offer":
      case "compensation_approval":
        database.insert(interviewHrResults).values({
          id: randomUUID(),
          candidateId,
          expectedCtc: payload.expectedCtc as number,
          offeredCtc: payload.offeredCtc as number,
          joiningDate: payload.joiningDate as string,
          decision: payload.decision as string,
          notes: payload.notes as string,
          createdAt: now,
        }).run();
        return;
      case "bgc_vendor_check":
        database.insert(interviewBgcResults).values({
          id: randomUUID(),
          candidateId,
          vendorReference: payload.vendorReference as string,
          identityVerified: payload.identityVerified as boolean,
          employmentVerified: payload.employmentVerified as boolean,
          decision: payload.decision as string,
          notes: payload.notes as string,
          createdAt: now,
        }).run();
        return;
      case "selection_details":
        database.insert(interviewSelections).values({
          id: randomUUID(),
          candidateId,
          employeeId: payload.employeeId as string,
          welcomeEmailSent: payload.welcomeEmailSent as boolean,
          notes: payload.notes as string,
          createdAt: now,
        }).run();
        return;
      case "closure":
        database.insert(interviewClosures).values({
          id: randomUUID(),
          candidateId,
          closureReason: payload.closureReason as string,
          notes: payload.notes as string,
          createdAt: now,
        }).run();
        return;
      default:
        throw new Error(`No interview persistence handler for ${formKey}.`);
    }
  },
} satisfies WorkflowConfig<InterviewContext>;

