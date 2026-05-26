import { z } from "zod";

export const interviewStageIds = [
  "basic_details",
  "round1",
  "round2",
  "alternate_round",
  "hr",
  "bgc_check",
  "selected",
  "completed",
] as const;

export const interviewStageIdSchema = z.enum(interviewStageIds);

export type InterviewStageId = z.infer<typeof interviewStageIdSchema>;

export const stageDecisionSchema = z.enum([
  "continue",
  "selected",
  "rejected",
  "accepted",
  "declined",
  "clear",
  "failed",
  "completed",
]);

export type StageDecision = z.infer<typeof stageDecisionSchema>;

export const caseStatusSchema = z.enum([
  "draft",
  "in_progress",
  "selected",
  "rejected",
  "declined",
  "bgc_failed",
  "completed",
]);

export type CaseStatus = z.infer<typeof caseStatusSchema>;

export const basicDetailsSchema = z.object({
  candidateName: z.string().min(2),
  candidateEmail: z.string().email(),
  role: z.string().min(2),
  source: z.string().min(2),
  yearsOfExperience: z.coerce.number().int().min(0).max(60),
});

export const round1Schema = z.object({
  interviewerId: z.string().min(1),
  score: z.coerce.number().int().min(1).max(10),
  decision: z.enum(["selected", "rejected"]),
  skipRound2: z.boolean().default(false),
  notes: z.string().min(5),
});

export const round2Schema = z.object({
  panelId: z.string().min(1),
  systemDesignScore: z.coerce.number().int().min(1).max(10),
  codingScore: z.coerce.number().int().min(1).max(10),
  decision: z.enum(["selected", "rejected"]),
  notes: z.string().min(5),
});

export const alternateRoundSchema = z.object({
  reason: z.string().min(5),
  reviewerId: z.string().min(1),
  decision: z.enum(["selected", "rejected"]),
  notes: z.string().min(5),
});

export const hrSchema = z.object({
  expectedCtc: z.coerce.number().positive(),
  offeredCtc: z.coerce.number().positive(),
  joiningDate: z.string().min(8),
  decision: z.enum(["accepted", "declined"]),
  notes: z.string().min(5),
});

export const bgcCheckSchema = z.object({
  vendorReference: z.string().min(2),
  identityVerified: z.boolean(),
  employmentVerified: z.boolean(),
  decision: z.enum(["clear", "failed"]),
  notes: z.string().min(5),
});

export const selectedSchema = z.object({
  employeeId: z.string().min(2),
  welcomeEmailSent: z.boolean(),
  notes: z.string().min(5),
});

export const completedSchema = z.object({
  closureReason: z.string().min(5),
  notes: z.string().min(5),
});

export const stageSchemas = {
  basic_details: basicDetailsSchema,
  round1: round1Schema,
  round2: round2Schema,
  alternate_round: alternateRoundSchema,
  hr: hrSchema,
  bgc_check: bgcCheckSchema,
  selected: selectedSchema,
  completed: completedSchema,
} satisfies Record<InterviewStageId, z.ZodType>;

export type InterviewStagePayload<TStage extends InterviewStageId = InterviewStageId> =
  z.infer<(typeof stageSchemas)[TStage]>;

export const submitStageSchema = z.object({
  expectedVersion: z.number().int().min(0),
  actorId: z.string().min(1),
  stage: interviewStageIdSchema,
  payload: z.unknown(),
});

