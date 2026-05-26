# Reusable Workflow Wizard

This folder contains a reusable workflow runtime for cases that move through stages while saving each form into its own domain table.

The key idea is separation:

- `workflow_instances` stores only workflow pointer data: workflow key, entity table, entity id, current stage, status, and version.
- `workflow_transitions` stores only audit data for a stage movement: actor, stage, form key, next stage, next status, and versions.
- Domain tables store the actual form data. In the interview example, candidate details, round results, HR results, BGC checks, selections, and closures each have separate tables.

## Central Config

The central config is [domain/interview-workflow.ts](/Users/shambhutiwary/Desktop/Developer/codeapp/wizard/domain/interview-workflow.ts).

Each workflow defines:

- `key`: stable workflow identifier.
- `entityTable`: the table this workflow runs against.
- `initialStage`: first stage.
- `stages`: labels and one or more form configs per stage.
- `forms`: form key, label, Zod schema, default values, and optional `isVisible(context)`.
- `resolveTransition`: the stage routing rules.
- `saveForm`: bound on the server to persist each form into the right domain table.

This makes adding a new case type mostly a config exercise:

1. Add the domain tables.
2. Add form schemas and components.
3. Add a `WorkflowConfig`.
4. Bind `saveForm` on the server.
5. Render the workflow with the generic form mapping pattern used by `InterviewWizard`.

The reusable renderer is [components/WorkflowWizard.tsx](/Users/shambhutiwary/Desktop/Developer/codeapp/wizard/components/WorkflowWizard.tsx). `InterviewWizard` is only a wrapper that passes the interview config and a `formKey -> component` map.

## Next.js App Router Placement

Move these API routes into your Next app:

- `wizard/api/interview-cases/[caseId]` -> `app/api/interview-cases/[caseId]`
- `wizard/api/interview-cases/[caseId]/stage` -> `app/api/interview-cases/[caseId]/stage`

After moving files, update imports to your project alias, for example `@/wizard/server/interview-case-repository`.

Expected packages:

```sh
pnpm add react-hook-form @hookform/resolvers zod drizzle-orm better-sqlite3
pnpm add -D @types/better-sqlite3
```
