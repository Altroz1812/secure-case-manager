

# Bulk CSV Upload + Field Executive Case Flow

## What We're Building

A complete workflow covering:
1. **Bulk CSV Upload** -- Admin/Branch Manager uploads a CSV (like the ALFA format) containing multiple cases with client details, verification types, addresses, FE codes, geo limits, and priorities.
2. **Case Assignment to Executives** -- Uploaded cases become leads with auto-generated tasks, assignable to field executives.
3. **Field Executive Mobile-Friendly View** -- FEs see assigned cases with address only initially. They can Accept or Send Back (non-serviceable/geo limit). On acceptance, a pre-filled verification form (matching the ALFA BV PDF format) appears for them to complete additional fields.
4. **Stage-Based Flow** -- Cases move through: Assigned → Accepted/Sent Back → In Progress → Form Submitted → QC Review → Approved/Rejected.

## Technical Plan

### 1. Database Changes (Migration)

**New table: `bulk_uploads`**
- `id`, `uploaded_by`, `file_name`, `total_rows`, `processed_rows`, `failed_rows`, `status` (pending/processing/completed/failed), `error_log` (jsonb), `branch_id`, `created_at`

**New table: `case_field_data`** (stores the BV/verification form fields per task)
- `id`, `task_id` (FK), `field_data` (jsonb -- stores all form fields like Customer Located, Entry Allowed, Person Met, Office Type, Board Seen, etc.), `form_type` (text -- maps to verification type like BV, RV), `submitted_at`, `submitted_by`, `created_at`, `updated_at`

**Add columns to `tasks` table:**
- `fe_response` (enum: null/accepted/sent_back)
- `send_back_reason` (text)
- `geo_limit` (text -- from CSV)
- `fe_code` (text -- from CSV)

**Add `category` column to `leads` table** (from CSV: BV, RV, etc.)

RLS: branch-isolated access on `bulk_uploads` and `case_field_data`.

### 2. Bulk CSV Upload Page (`/bulk-upload`)

- Accessible to Admin and Ops Manager roles
- CSV file picker with drag-and-drop
- CSV column mapping preview (shows parsed rows before import)
- Maps CSV columns to system fields:
  - Client Name → look up `clients` table
  - Branch → look up `branches` table  
  - Product → look up `products` table
  - Verification → map to `verification_type` enum
  - FE Code → map to `field_executives.employee_code`
  - Applicant Name, Co-Applicant, Address, Mobile, Pin Code, Priority, Geo Limit
- Validation pass: highlight errors (unknown client, missing fields)
- On confirm: creates leads + auto-generates tasks via existing trigger
- Shows upload progress and result summary

### 3. Enhanced Field Executive "My Tasks" View

Rework the existing `MyTasksPage` for the FE workflow:

**Stage 1 -- New Cases (status: assigned, fe_response: null)**
- Shows only: Task Number, Verification Type, Applicant Name, Address, Pin Code
- Two buttons: "Accept" and "Send Back"
- Send Back requires a reason (non-serviceable area, geo limit exceeded, etc.)

**Stage 2 -- Accepted Cases (fe_response: accepted, status: in_progress)**  
- Full pre-filled verification form appears (based on the ALFA PDF format)
- Pre-filled from CSV data: Client, Branch, Product, Applicant Name, Co-Applicant, Address, Contact Number
- Empty fields for FE to fill: Customer Located, Entry Allowed, Person Met, Relationship, Office Type, Board Seen, Business Activity, Nature of Business, Number of Employees, Area Sqft, Landmark, etc.
- Photo upload section for office/business/residence photos
- Date and Time of Visit auto-captured
- Submit button moves task to "completed" status

**Stage 3 -- Submitted / QC Review**
- Read-only view of submitted form
- Status badges showing QC progress

### 4. Verification Form Component

New `FieldVerificationForm` component that renders form fields dynamically based on verification type:

**BV (Business Verification) fields** (from PDF):
- Customer Located (Yes/No)
- Entry Allowed (Yes/No)
- Entry Allowed Till
- Person Met
- Relationship
- Family Members
- Office Type (dropdown)
- Negative Area (Yes/No)
- Met Person Designation
- Applicant Designation
- Working Since
- ID Check (Yes/No)
- ID Number
- Board Seen (Yes/No)
- Business Activity Seen (Yes/No)
- Stock Seen (Yes/No)
- Nature of Business
- Number of Employees
- Area Sqft
- Office is in (owned/rented/etc.)
- Office Asset Seen (Yes/No)
- Landmark
- Date and Time of Visit (auto)
- Photo upload

### 5. Route and Navigation Updates

- Add `/bulk-upload` route (Admin, Ops Manager)
- Add sidebar menu item "Bulk Upload" under Intake section
- Update My Tasks page for FE accept/send-back flow

### 6. Files to Create/Modify

**New files:**
- `src/pages/intake/BulkUploadPage.tsx` -- CSV upload UI with preview and validation
- `src/components/tasks/FieldVerificationForm.tsx` -- Dynamic verification form matching PDF format
- `src/hooks/useBulkUpload.ts` -- CSV parsing, validation, and batch insert logic
- `src/hooks/useCaseFieldData.ts` -- CRUD for case field data

**Modified files:**
- `src/App.tsx` -- Add bulk upload route
- `src/components/layout/AppSidebar.tsx` -- Add bulk upload nav item
- `src/pages/tasks/MyTasksPage.tsx` -- Add accept/send-back flow for FEs
- `src/pages/tasks/TaskDetailPage.tsx` -- Show verification form data
- `src/hooks/useTasks.ts` -- Add fe_response fields to TaskWithDetails

### Stages Flow Summary

```text
CSV Upload → Lead Created → Task Auto-Generated (Assigned)
                                    ↓
                        FE Sees Case (Address Only)
                           ↓              ↓
                       [Accept]      [Send Back]
                          ↓               ↓
                   Pre-filled Form    Back to Pool
                   FE Fills Details   (with reason)
                          ↓
                    [Submit Form]
                          ↓
                     QC Review
                      ↓      ↓
                 [Approve] [Reject]
```

