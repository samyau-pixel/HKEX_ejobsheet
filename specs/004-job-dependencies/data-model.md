# Data Model: Job Dependencies

## TemplateJob (existing + additions)

- `id` (string|int): primary identifier
- `title` (string)
- `description` (string)
- `order` (int)
- `timeDependency` (nullable datetime, stored in UTC)
- `prerequisiteJobIds` (array of `id`): list of TemplateJob ids that must be completed before this job

## ExecutionJob (cloned from TemplateJob)

- `id` (string|int)
- `templateJobId` (string|int)
- `title` (string)
- `description` (string)
- `order` (int)
- `timeDependency` (nullable datetime, copied from template)
- `prerequisiteJobIds` (array of execution job ids OR template job ids — implementation note below)
- `completedAt` (nullable datetime)
- `status` (enum: pending, in_progress, completed)

## Implementation Notes

- On clone: convert `prerequisiteJobIds` from template-job ids to the corresponding `executionJob` ids in the cloned execution sheet to enforce runtime relationships.
- Cycle detection is enforced on the template-level only.
- Time comparisons use UTC; UI converts display to local timezone.

