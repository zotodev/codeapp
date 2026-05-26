import type { z } from "zod";

export type WorkflowStatus = "active" | "selected" | "rejected" | "declined" | "failed" | "completed";

export type WorkflowInstanceSnapshot = {
  id: string;
  workflowKey: string;
  entityTable: string;
  entityId: string;
  currentStage: string;
  status: WorkflowStatus | string;
  version: number;
  updatedAt: Date;
};

export type StageFormConfig<TContext = unknown> = {
  key: string;
  label: string;
  schema: z.ZodType;
  defaultValues: Record<string, unknown>;
  isVisible?: (context: TContext) => boolean;
};

export type StageConfig<TContext = unknown> = {
  key: string;
  label: string;
  forms: StageFormConfig<TContext>[];
};

export type WorkflowSubmitContext<TContext = unknown> = {
  actorId: string;
  entityId: string;
  workflowInstance: WorkflowInstanceSnapshot;
  context: TContext;
};

export type WorkflowTransition = {
  nextStage: string;
  status: WorkflowStatus | string;
};

export type WorkflowConfig<TContext = unknown> = {
  key: string;
  entityTable: string;
  initialStage: string;
  stages: StageConfig<TContext>[];
  resolveContext: (entityId: string) => Promise<TContext> | TContext;
  saveForm: (input: {
    tx: unknown;
    formKey: string;
    stage: string;
    payload: Record<string, unknown>;
    submitContext: WorkflowSubmitContext<TContext>;
  }) => void;
  resolveTransition: (input: {
    formKey: string;
    stage: string;
    payload: Record<string, unknown>;
    submitContext: WorkflowSubmitContext<TContext>;
  }) => WorkflowTransition;
};

export function getStageConfig(config: WorkflowConfig, stage: string) {
  const stageConfig = config.stages.find((item) => item.key === stage);

  if (!stageConfig) {
    throw new Error(`Workflow ${config.key} does not define stage ${stage}.`);
  }

  return stageConfig;
}

export function getFormConfig(config: WorkflowConfig, stage: string, formKey: string) {
  const stageConfig = getStageConfig(config, stage);
  const formConfig = stageConfig.forms.find((item) => item.key === formKey);

  if (!formConfig) {
    throw new Error(`Workflow ${config.key} stage ${stage} does not define form ${formKey}.`);
  }

  return formConfig;
}
