import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { workflowInstances, workflowTransitions } from "../db/schema";
import {
  getFormConfig,
  type WorkflowConfig,
  type WorkflowInstanceSnapshot,
} from "../domain/workflow-types";

export type SubmitWorkflowStageInput = {
  workflowKey: string;
  entityId: string;
  expectedVersion: number;
  actorId: string;
  stage: string;
  formKey: string;
  payload: unknown;
};

export type SubmitWorkflowStageResult = {
  workflowInstance: WorkflowInstanceSnapshot;
  transitionId: string;
};

export function getWorkflowInstance(config: WorkflowConfig, entityId: string) {
  const row = db
    .select()
    .from(workflowInstances)
    .where(
      and(
        eq(workflowInstances.workflowKey, config.key),
        eq(workflowInstances.entityTable, config.entityTable),
        eq(workflowInstances.entityId, entityId),
      ),
    )
    .get();

  return row ? toSnapshot(row) : null;
}

export function ensureWorkflowInstance(config: WorkflowConfig, entityId: string) {
  const existing = getWorkflowInstance(config, entityId);

  if (existing) {
    return existing;
  }

  const now = new Date();
  const id = randomUUID();

  db.insert(workflowInstances)
    .values({
      id,
      workflowKey: config.key,
      entityTable: config.entityTable,
      entityId,
      currentStage: config.initialStage,
      status: "active",
      version: 0,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return {
    id,
    workflowKey: config.key,
    entityTable: config.entityTable,
    entityId,
    currentStage: config.initialStage,
    status: "active",
    version: 0,
    updatedAt: now,
  };
}

export async function submitWorkflowStage<TContext>(
  config: WorkflowConfig<TContext>,
  input: SubmitWorkflowStageInput,
): Promise<SubmitWorkflowStageResult> {
  if (input.workflowKey !== config.key) {
    throw new Error(`Expected workflow ${config.key}, received ${input.workflowKey}.`);
  }

  const context = await config.resolveContext(input.entityId);

  return db.transaction((tx) => {
    const row = tx
      .select()
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.workflowKey, config.key),
          eq(workflowInstances.entityTable, config.entityTable),
          eq(workflowInstances.entityId, input.entityId),
          eq(workflowInstances.version, input.expectedVersion),
        ),
      )
      .get();

    if (!row) {
      throw new Error("Workflow was updated by someone else. Refresh before submitting.");
    }

    if (row.currentStage !== input.stage) {
      throw new Error(`Workflow is currently in ${row.currentStage}; cannot submit ${input.stage}.`);
    }

    const formConfig = getFormConfig(config, input.stage, input.formKey);
    const payload = formConfig.schema.parse(input.payload) as Record<string, unknown>;
    const currentSnapshot = toSnapshot(row);
    const submitContext = {
      actorId: input.actorId,
      entityId: input.entityId,
      workflowInstance: currentSnapshot,
      context,
    };

    config.saveForm({
      tx,
      formKey: input.formKey,
      stage: input.stage,
      payload,
      submitContext,
    });

    const transition = config.resolveTransition({
      formKey: input.formKey,
      stage: input.stage,
      payload,
      submitContext,
    });
    const nextVersion = row.version + 1;
    const now = new Date();
    const transitionId = randomUUID();

    tx.insert(workflowTransitions)
      .values({
        id: transitionId,
        workflowInstanceId: row.id,
        actorId: input.actorId,
        stage: input.stage,
        formKey: input.formKey,
        nextStage: transition.nextStage,
        nextStatus: transition.status,
        caseVersionBefore: row.version,
        caseVersionAfter: nextVersion,
        createdAt: now,
      })
      .run();

    tx.update(workflowInstances)
      .set({
        currentStage: transition.nextStage,
        status: transition.status,
        version: nextVersion,
        updatedAt: now,
      })
      .where(eq(workflowInstances.id, row.id))
      .run();

    return {
      transitionId,
      workflowInstance: {
        ...currentSnapshot,
        currentStage: transition.nextStage,
        status: transition.status,
        version: nextVersion,
        updatedAt: now,
      },
    };
  });
}

function toSnapshot(row: typeof workflowInstances.$inferSelect): WorkflowInstanceSnapshot {
  return {
    id: row.id,
    workflowKey: row.workflowKey,
    entityTable: row.entityTable,
    entityId: row.entityId,
    currentStage: row.currentStage,
    status: row.status,
    version: row.version,
    updatedAt: row.updatedAt,
  };
}

