import {
  alternateRoundSchema,
  basicDetailsSchema,
  bgcCheckSchema,
  completedSchema,
  hrSchema,
  round1Schema,
  round2Schema,
  selectedSchema,
} from "./interview-stage-schemas";
import type { WorkflowConfig } from "./workflow-types";

export type InterviewContext = {
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  role: string | null;
  latestResumeUrl?: string;
  recruiterName?: string;
  flags?: {
    requiresCompensationApproval?: boolean;
  };
};

export const interviewWorkflowConfig = {
  key: "interview",
  entityTable: "interview_candidates",
  initialStage: "basic_details",
  stages: [
    {
      key: "basic_details",
      label: "Basic Details",
      forms: [
        {
          key: "candidate_basic_details",
          label: "Candidate Details",
          schema: basicDetailsSchema,
          defaultValues: {
            candidateName: "",
            candidateEmail: "",
            role: "",
            source: "",
            yearsOfExperience: 0,
          },
        },
      ],
    },
    {
      key: "round1",
      label: "Round 1",
      forms: [
        {
          key: "round1_feedback",
          label: "Round 1 Feedback",
          schema: round1Schema,
          defaultValues: {
            interviewerId: "",
            score: 1,
            decision: "",
            skipRound2: false,
            notes: "",
          },
        },
      ],
    },
    {
      key: "round2",
      label: "Round 2",
      forms: [
        {
          key: "round2_feedback",
          label: "Round 2 Feedback",
          schema: round2Schema,
          defaultValues: {
            panelId: "",
            systemDesignScore: 1,
            codingScore: 1,
            decision: "",
            notes: "",
          },
        },
      ],
    },
    {
      key: "alternate_round",
      label: "Alternate Round",
      forms: [
        {
          key: "alternate_round_feedback",
          label: "Alternate Round Feedback",
          schema: alternateRoundSchema,
          defaultValues: {
            reason: "",
            reviewerId: "",
            decision: "",
            notes: "",
          },
        },
      ],
    },
    {
      key: "hr",
      label: "HR",
      forms: [
        {
          key: "hr_offer",
          label: "Offer Details",
          schema: hrSchema,
          defaultValues: {
            expectedCtc: 0,
            offeredCtc: 0,
            joiningDate: "",
            decision: "",
            notes: "",
          },
        },
        {
          key: "compensation_approval",
          label: "Compensation Approval",
          schema: hrSchema,
          defaultValues: {
            expectedCtc: 0,
            offeredCtc: 0,
            joiningDate: "",
            decision: "",
            notes: "",
          },
          isVisible: (context) => Boolean(context.flags?.requiresCompensationApproval),
        },
      ],
    },
    {
      key: "bgc_check",
      label: "BGC Check",
      forms: [
        {
          key: "bgc_vendor_check",
          label: "Vendor Check",
          schema: bgcCheckSchema,
          defaultValues: {
            vendorReference: "",
            identityVerified: false,
            employmentVerified: false,
            decision: "",
            notes: "",
          },
        },
      ],
    },
    {
      key: "selected",
      label: "Selected",
      forms: [
        {
          key: "selection_details",
          label: "Selection Details",
          schema: selectedSchema,
          defaultValues: {
            employeeId: "",
            welcomeEmailSent: false,
            notes: "",
          },
        },
      ],
    },
    {
      key: "completed",
      label: "Completed",
      forms: [
        {
          key: "closure",
          label: "Closure",
          schema: completedSchema,
          defaultValues: {
            closureReason: "",
            notes: "",
          },
        },
      ],
    },
  ],
  resolveContext: async (candidateId) => ({
    candidateId,
    candidateName: null,
    candidateEmail: null,
    role: null,
  }),
  saveForm: () => {
    throw new Error("interviewWorkflowConfig.saveForm must be bound on the server.");
  },
  resolveTransition: ({ stage, payload }) => {
    switch (stage) {
      case "basic_details":
        return { nextStage: "round1", status: "active" };
      case "round1":
        if (payload.decision === "rejected") {
          return { nextStage: "alternate_round", status: "active" };
        }

        return payload.skipRound2
          ? { nextStage: "hr", status: "active" }
          : { nextStage: "round2", status: "active" };
      case "round2":
        return payload.decision === "rejected"
          ? { nextStage: "completed", status: "rejected" }
          : { nextStage: "hr", status: "active" };
      case "alternate_round":
        return payload.decision === "rejected"
          ? { nextStage: "completed", status: "rejected" }
          : { nextStage: "bgc_check", status: "active" };
      case "hr":
        return payload.decision === "declined"
          ? { nextStage: "completed", status: "declined" }
          : { nextStage: "bgc_check", status: "active" };
      case "bgc_check":
        return payload.decision === "failed"
          ? { nextStage: "completed", status: "failed" }
          : { nextStage: "selected", status: "selected" };
      case "selected":
        return { nextStage: "completed", status: "completed" };
      case "completed":
        return { nextStage: "completed", status: "completed" };
      default:
        throw new Error(`Unhandled interview stage ${stage}.`);
    }
  },
} satisfies WorkflowConfig<InterviewContext>;
