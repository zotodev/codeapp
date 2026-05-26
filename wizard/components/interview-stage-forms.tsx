"use client";

import { useFormContext } from "react-hook-form";

type FieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "number" | "date" | "checkbox" | "textarea";
};

export function BasicDetailsForm() {
  return (
    <>
      <Field label="Candidate name" name="candidateName" />
      <Field label="Candidate email" name="candidateEmail" type="email" />
      <Field label="Role" name="role" />
      <Field label="Source" name="source" />
      <Field label="Years of experience" name="yearsOfExperience" type="number" />
    </>
  );
}

export function Round1Form() {
  return (
    <>
      <Field label="Interviewer ID" name="interviewerId" />
      <Field label="Score" name="score" type="number" />
      <DecisionSelect name="decision" options={["selected", "rejected"]} />
      <Field label="Skip round 2" name="skipRound2" type="checkbox" />
      <Field label="Notes" name="notes" type="textarea" />
    </>
  );
}

export function Round2Form() {
  return (
    <>
      <Field label="Panel ID" name="panelId" />
      <Field label="System design score" name="systemDesignScore" type="number" />
      <Field label="Coding score" name="codingScore" type="number" />
      <DecisionSelect name="decision" options={["selected", "rejected"]} />
      <Field label="Notes" name="notes" type="textarea" />
    </>
  );
}

export function AlternateRoundForm() {
  return (
    <>
      <Field label="Reason" name="reason" type="textarea" />
      <Field label="Reviewer ID" name="reviewerId" />
      <DecisionSelect name="decision" options={["selected", "rejected"]} />
      <Field label="Notes" name="notes" type="textarea" />
    </>
  );
}

export function HrForm() {
  return (
    <>
      <Field label="Expected CTC" name="expectedCtc" type="number" />
      <Field label="Offered CTC" name="offeredCtc" type="number" />
      <Field label="Joining date" name="joiningDate" type="date" />
      <DecisionSelect name="decision" options={["accepted", "declined"]} />
      <Field label="Notes" name="notes" type="textarea" />
    </>
  );
}

export function BgcCheckForm() {
  return (
    <>
      <Field label="Vendor reference" name="vendorReference" />
      <Field label="Identity verified" name="identityVerified" type="checkbox" />
      <Field label="Employment verified" name="employmentVerified" type="checkbox" />
      <DecisionSelect name="decision" options={["clear", "failed"]} />
      <Field label="Notes" name="notes" type="textarea" />
    </>
  );
}

export function SelectedForm() {
  return (
    <>
      <Field label="Employee ID" name="employeeId" />
      <Field label="Welcome email sent" name="welcomeEmailSent" type="checkbox" />
      <Field label="Notes" name="notes" type="textarea" />
    </>
  );
}

export function CompletedForm() {
  return (
    <>
      <Field label="Closure reason" name="closureReason" type="textarea" />
      <Field label="Notes" name="notes" type="textarea" />
    </>
  );
}

function Field({ label, name, type = "text" }: FieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message;
  const controlClassName = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      {type === "textarea" ? (
        <textarea className={controlClassName} rows={4} {...register(name)} />
      ) : type === "checkbox" ? (
        <input className="size-4" type="checkbox" {...register(name)} />
      ) : (
        <input className={controlClassName} type={type} {...register(name)} />
      )}
      {typeof error === "string" ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function DecisionSelect({ name, options }: { name: string; options: string[] }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message;

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-800">Decision</span>
      <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register(name)}>
        <option value="">Select decision</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {typeof error === "string" ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

