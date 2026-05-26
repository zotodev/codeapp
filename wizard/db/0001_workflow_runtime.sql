CREATE TABLE `workflow_instances` (
  `id` text PRIMARY KEY NOT NULL,
  `workflow_key` text NOT NULL,
  `entity_table` text NOT NULL,
  `entity_id` text NOT NULL,
  `current_stage` text NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `version` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX `workflow_instances_entity_idx`
ON `workflow_instances` (`workflow_key`, `entity_table`, `entity_id`);

CREATE TABLE `workflow_transitions` (
  `id` text PRIMARY KEY NOT NULL,
  `workflow_instance_id` text NOT NULL,
  `actor_id` text NOT NULL,
  `stage` text NOT NULL,
  `form_key` text NOT NULL,
  `next_stage` text NOT NULL,
  `next_status` text NOT NULL,
  `case_version_before` integer NOT NULL,
  `case_version_after` integer NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`workflow_instance_id`) REFERENCES `workflow_instances`(`id`)
);

CREATE TABLE `interview_candidates` (
  `id` text PRIMARY KEY NOT NULL,
  `candidate_name` text,
  `candidate_email` text,
  `role` text,
  `source` text,
  `years_of_experience` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `interview_round1_results` (
  `id` text PRIMARY KEY NOT NULL,
  `candidate_id` text NOT NULL,
  `interviewer_id` text NOT NULL,
  `score` integer NOT NULL,
  `decision` text NOT NULL,
  `skip_round2` integer DEFAULT 0 NOT NULL,
  `notes` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`candidate_id`) REFERENCES `interview_candidates`(`id`)
);

CREATE TABLE `interview_round2_results` (
  `id` text PRIMARY KEY NOT NULL,
  `candidate_id` text NOT NULL,
  `panel_id` text NOT NULL,
  `system_design_score` integer NOT NULL,
  `coding_score` integer NOT NULL,
  `decision` text NOT NULL,
  `notes` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`candidate_id`) REFERENCES `interview_candidates`(`id`)
);

CREATE TABLE `interview_alternate_round_results` (
  `id` text PRIMARY KEY NOT NULL,
  `candidate_id` text NOT NULL,
  `reason` text NOT NULL,
  `reviewer_id` text NOT NULL,
  `decision` text NOT NULL,
  `notes` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`candidate_id`) REFERENCES `interview_candidates`(`id`)
);

CREATE TABLE `interview_hr_results` (
  `id` text PRIMARY KEY NOT NULL,
  `candidate_id` text NOT NULL,
  `expected_ctc` integer NOT NULL,
  `offered_ctc` integer NOT NULL,
  `joining_date` text NOT NULL,
  `decision` text NOT NULL,
  `notes` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`candidate_id`) REFERENCES `interview_candidates`(`id`)
);

CREATE TABLE `interview_bgc_results` (
  `id` text PRIMARY KEY NOT NULL,
  `candidate_id` text NOT NULL,
  `vendor_reference` text NOT NULL,
  `identity_verified` integer NOT NULL,
  `employment_verified` integer NOT NULL,
  `decision` text NOT NULL,
  `notes` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`candidate_id`) REFERENCES `interview_candidates`(`id`)
);

CREATE TABLE `interview_selections` (
  `id` text PRIMARY KEY NOT NULL,
  `candidate_id` text NOT NULL,
  `employee_id` text NOT NULL,
  `welcome_email_sent` integer NOT NULL,
  `notes` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`candidate_id`) REFERENCES `interview_candidates`(`id`)
);

CREATE TABLE `interview_closures` (
  `id` text PRIMARY KEY NOT NULL,
  `candidate_id` text NOT NULL,
  `closure_reason` text NOT NULL,
  `notes` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`candidate_id`) REFERENCES `interview_candidates`(`id`)
);
