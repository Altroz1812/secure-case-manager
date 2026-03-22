

# Fix: Enable Manual Assignment and Reassignment for Uploaded Cases

## Problem
The "Assign" button in the Tasks List page only appears when `task.status === 'pending' || !task.assigned_to`. This means once a task is assigned, there's no reassign button visible. Additionally, tasks from bulk upload may need initial manual assignment or reassignment to different FEs.

## Changes

### 1. Show Assign/Reassign button for all actionable statuses (TasksListPage.tsx)
- Change the condition on line 151-155 from only showing for `pending`/unassigned to also showing a "Reassign" icon for tasks in `assigned`, `in_progress`, or `sent_back` statuses
- Add a "Reassign" icon (e.g., `UserCog` or `RefreshCw`) alongside the view button for already-assigned tasks

### 2. Show Assign/Reassign button on TaskDetailPage.tsx
- Add a prominent "Assign" or "Reassign" button in the task detail header area so admins/ops managers can assign or reassign from the detail view
- The `TaskAssignmentDialog` already handles both assign and reassign flows with mandatory reason for reassignment

### 3. No backend changes needed
- The `TaskAssignmentDialog` component already supports both assignment and reassignment with role checks (Admin, QC, Ops Manager can reassign)
- The `useAssignTask` mutation already updates the task and creates an assignment audit record
- RLS policies already allow authorized roles to update tasks

## Files to modify
- `src/pages/tasks/TasksListPage.tsx` -- expand the assign button visibility condition
- `src/pages/tasks/TaskDetailPage.tsx` -- add assign/reassign button in the header

