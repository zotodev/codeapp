# Reusable Case Workflow Scenario

## Requirement

Many case tables need workflow behavior: interviews, onboarding, support tickets, loan review, claims, and other staged processes. Each case type has its own domain tables, but all of them need the same workflow capabilities:

- Persist the current stage so multiple users see the same case position.
- Prevent silent overwrites when two people submit the same case at the same time.
- Route to different next stages based on submitted form values or existing case context.
- Show one or more forms for a stage depending on status, flags, permissions, or other controls.
- Keep form validation local to the active form.
- Avoid storing form state or domain payloads inside the workflow runtime tables.

## Generic Tables

`workflow_instances`

Stores one row per running workflow for any entity table.

- `workflow_key`: example `interview`, `loan_review`, `support_case`.
- `entity_table`: example `interview_candidates`.
- `entity_id`: id of the domain row.
- `current_stage`: current configured stage key.
- `status`: active or final workflow status.
- `version`: optimistic concurrency counter.

`workflow_transitions`

Stores audit rows for submissions and transitions.

- `workflow_instance_id`
- `actor_id`
- `stage`
- `form_key`
- `next_stage`
- `next_status`
- version before and after

It intentionally does not store the form payload. Payloads belong in the domain tables.

## Interview Example

Domain tables:

- `interview_candidates`
- `interview_round1_results`
- `interview_round2_results`
- `interview_alternate_round_results`
- `interview_hr_results`
- `interview_bgc_results`
- `interview_selections`
- `interview_closures`

Workflow:

1. `basic_details`
2. `round1`
3. Conditional route:
   - Round 1 rejected -> `alternate_round`
   - Round 1 selected with `skipRound2` -> `hr`
   - Round 1 selected without skip -> `round2`
4. `round2`
   - Rejected -> `completed`
   - Selected -> `hr`
5. `alternate_round`
   - Rejected -> `completed`
   - Selected -> `bgc_check`
6. `hr`
   - Declined -> `completed`
   - Accepted -> `bgc_check`
   - Can show an extra `compensation_approval` form when `context.flags.requiresCompensationApproval` is true.
7. `bgc_check`
   - Failed -> `completed`
   - Clear -> `selected`
8. `selected`
9. `completed`

## Plug-in Model

Each stage has a list of form configs:

```ts
{
  key: "hr",
  label: "HR",
  forms: [
    { key: "hr_offer", schema: hrSchema, defaultValues: {...} },
    {
      key: "compensation_approval",
      schema: hrSchema,
      defaultValues: {...},
      isVisible: (context) => context.flags.requiresCompensationApproval,
    },
  ],
}
```

Each visible form gets its own React Hook Form instance. Submitting a form:

1. Validates only that form schema.
2. Saves to the mapped domain table.
3. Advances the generic workflow instance in the same transaction.

