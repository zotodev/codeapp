"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type {
  StageFormConfig,
  WorkflowConfig,
  WorkflowInstanceSnapshot,
} from "../domain/workflow-types";

export type WorkflowFormComponent = () => ReactElement;

export type WorkflowWizardProps<TContext> = {
  actorId: string;
  config: WorkflowConfig<TContext>;
  context: TContext;
  formComponents: Record<string, WorkflowFormComponent>;
  submitUrl: string;
  workflowInstance: WorkflowInstanceSnapshot;
  onWorkflowChanged: (workflowInstance: WorkflowInstanceSnapshot) => void;
  renderContext?: (context: TContext) => ReactElement;
};

export function WorkflowWizard<TContext>({
  actorId,
  config,
  context,
  formComponents,
  submitUrl,
  workflowInstance,
  onWorkflowChanged,
  renderContext,
}: WorkflowWizardProps<TContext>) {
  const stageConfig = config.stages.find((stage) => stage.key === workflowInstance.currentStage);

  if (!stageConfig) {
    return <p>Unknown stage: {workflowInstance.currentStage}</p>;
  }

  const visibleForms = stageConfig.forms.filter((form) => !form.isVisible || form.isVisible(context));

  return (
    <section className="mx-auto grid max-w-3xl gap-5">
      <header className="grid gap-2">
        <p className="text-sm text-slate-500">Version {workflowInstance.version}</p>
        <h1 className="text-2xl font-semibold text-slate-950">{stageConfig.label}</h1>
        <Progress currentStage={workflowInstance.currentStage} config={config} />
      </header>

      {renderContext ? renderContext(context) : null}

      <div className="grid gap-5">
        {visibleForms.map((formConfig) => {
          const FormComponent = formComponents[formConfig.key];

          if (!FormComponent) {
            return (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" key={formConfig.key}>
                No component mapped for {formConfig.key}.
              </p>
            );
          }

          return (
            <WorkflowStageForm
              actorId={actorId}
              formConfig={formConfig}
              FormComponent={FormComponent}
              key={`${workflowInstance.id}:${workflowInstance.version}:${formConfig.key}`}
              onWorkflowChanged={onWorkflowChanged}
              stage={workflowInstance.currentStage}
              submitUrl={submitUrl}
              workflowInstance={workflowInstance}
            />
          );
        })}
      </div>
    </section>
  );
}

function WorkflowStageForm<TContext>({
  actorId,
  workflowInstance,
  formConfig,
  FormComponent,
  submitUrl,
  stage,
  onWorkflowChanged,
}: {
  actorId: string;
  workflowInstance: WorkflowInstanceSnapshot;
  formConfig: StageFormConfig<TContext>;
  FormComponent: WorkflowFormComponent;
  submitUrl: string;
  stage: string;
  onWorkflowChanged: (workflowInstance: WorkflowInstanceSnapshot) => void;
}) {
  const form = useForm({
    resolver: zodResolver(formConfig.schema),
    defaultValues: formConfig.defaultValues,
    mode: "onBlur",
  });

  async function submit(payload: Record<string, unknown>) {
    const response = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorId,
        expectedVersion: workflowInstance.version,
        stage,
        formKey: formConfig.key,
        payload,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      form.setError("root", {
        message: result.error ?? "Unable to submit this form.",
      });
      return;
    }

    onWorkflowChanged(result.workflowInstance);
  }

  return (
    <FormProvider {...form}>
      <form className="grid gap-4 rounded-md border border-slate-200 p-4" onSubmit={form.handleSubmit(submit)}>
        <h2 className="text-base font-semibold text-slate-950">{formConfig.label}</h2>
        <FormComponent />
        {form.formState.errors.root?.message ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

function Progress<TContext>({
  config,
  currentStage,
}: {
  config: WorkflowConfig<TContext>;
  currentStage: string;
}) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {config.stages.map((stage) => (
        <li
          className={
            stage.key === currentStage
              ? "rounded-md border border-slate-950 px-2 py-1 text-xs font-medium"
              : "rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500"
          }
          key={stage.key}
        >
          {stage.label}
        </li>
      ))}
    </ol>
  );
}

