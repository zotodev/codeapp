"use client";

import type { ReactElement } from "react";
import {
  interviewWorkflowConfig,
  type InterviewContext,
} from "../domain/interview-workflow";
import type { WorkflowInstanceSnapshot } from "../domain/workflow-types";
import {
  AlternateRoundForm,
  BasicDetailsForm,
  BgcCheckForm,
  CompletedForm,
  HrForm,
  Round1Form,
  Round2Form,
  SelectedForm,
} from "./interview-stage-forms";
import { WorkflowWizard, type WorkflowFormComponent } from "./WorkflowWizard";

type InterviewWizardProps = {
  actorId: string;
  workflowInstance: WorkflowInstanceSnapshot;
  context: InterviewContext;
  onWorkflowChanged: (workflowInstance: WorkflowInstanceSnapshot) => void;
};

const interviewFormComponents = {
  candidate_basic_details: BasicDetailsForm,
  round1_feedback: Round1Form,
  round2_feedback: Round2Form,
  alternate_round_feedback: AlternateRoundForm,
  hr_offer: HrForm,
  compensation_approval: HrForm,
  bgc_vendor_check: BgcCheckForm,
  selection_details: SelectedForm,
  closure: CompletedForm,
} satisfies Record<string, WorkflowFormComponent>;

export function InterviewWizard({
  actorId,
  workflowInstance,
  context,
  onWorkflowChanged,
}: InterviewWizardProps) {
  return (
    <WorkflowWizard
      actorId={actorId}
      config={interviewWorkflowConfig}
      context={context}
      formComponents={interviewFormComponents}
      onWorkflowChanged={onWorkflowChanged}
      renderContext={renderInterviewContext}
      submitUrl={`/api/interview-cases/${workflowInstance.entityId}/stage`}
      workflowInstance={workflowInstance}
    />
  );
}

function renderInterviewContext(context: InterviewContext): ReactElement {
  return (
    <aside className="grid gap-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
      <p>
        Candidate: <span className="font-medium">{context.candidateName ?? "Not captured yet"}</span>
      </p>
      <p>
        Role: <span className="font-medium">{context.role ?? "Not captured yet"}</span>
      </p>
      {context.recruiterName ? <p>Recruiter: {context.recruiterName}</p> : null}
      {context.latestResumeUrl ? (
        <a className="text-blue-700 underline" href={context.latestResumeUrl} rel="noreferrer" target="_blank">
          Latest resume
        </a>
      ) : null}
    </aside>
  );
}

