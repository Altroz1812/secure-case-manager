

# Consolidate Tasks Pages and Hide Unaccepted Tasks

## Problem

1. **"Tasks" and "My Tasks" are nearly identical** with no clear role-based separation or validation. Both show task lists with overlapping data and no meaningful access control difference.
2. **Tasks appear in the list before the FE accepts them.** The workflow requires FEs to Accept/Send Back, but currently all assigned tasks show up everywhere immediately.

## Proposed Changes

### 1. Remove "Tasks" page for Field Executives -- merge into "My Tasks"

- **"My Tasks" (`/my-tasks`)** stays as the FE-only view with the accept/send-back workflow. Available to `field_executive` and `analyst` roles.
- **"All Tasks" (`/tasks`)** becomes an **admin/ops/QC-only** supervisory view. Remove `field_executive` from its allowed roles in the sidebar.
- This gives clear purpose: FEs use "My Tasks" for their workflow; managers use "All Tasks" for oversight and assignment.

### 2. Hide unaccepted tasks from the "All Tasks" supervisory view

In `TasksListPage.tsx`, filter out tasks where `fe_response` is `null` and status is `assigned` (i.e., the FE hasn't accepted yet). These should only be visible in the FE's "My Tasks" view. Supervisors will see:
- **Pending** tasks (unassigned, ready for assignment)
- **Accepted/In Progress** tasks (FE working on them)
- **Completed/QC/Approved/Rejected** tasks

Optionally add a "Pending Acceptance" stats card so managers know how many tasks are awaiting FE response, without cluttering the main table.

### 3. Add status filter for "Pending Acceptance" in All Tasks

Add a new filter option "Pending FE Acceptance" that explicitly shows tasks where `status = 'assigned'` and `fe_response IS NULL`, so managers can see them when needed but they're hidden by default.

## Files to Modify

- **`src/components/layout/AppSidebar.tsx`** -- Remove `field_executive` from the "Tasks" nav item roles
- **`src/pages/tasks/TasksListPage.tsx`** -- Filter out unaccepted tasks by default; add "Pending Acceptance" filter option and stats card
- **`src/hooks/useTasks.ts`** -- Add `excludeUnaccepted` filter option to the `useTasks` hook

## Summary

| Page | Who sees it | What it shows |
|------|------------|---------------|
| My Tasks | FE, Analyst | Only their assigned tasks with accept/send-back workflow |
| All Tasks | Admin, Ops Manager, QC | All tasks except unaccepted (with toggle to view them) |

