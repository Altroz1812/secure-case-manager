

# Add Geo-Tagging and Multi-Photo Upload to Verification Form

## Problem
The FE's verification form (`FieldVerificationForm` on My Tasks) has no photo upload or GPS capture. Evidence upload exists only on the separate Task Detail page's "Evidence" tab, which FEs don't navigate to from their workflow.

## Changes

### 1. Add multi-photo upload section to FieldVerificationForm
- Add a new "Photo Evidence" section below the verification fields in `FieldVerificationForm.tsx`
- Support selecting **multiple files at once** (via `multiple` attribute on file input)
- Show thumbnail previews of all selected/uploaded photos in a grid
- Allow removing individual photos before upload
- Auto-capture GPS once when the first photo is selected

### 2. Add GPS location capture to the form
- Add a "Capture Location" button at the top of the form that uses `navigator.geolocation`
- Display captured coordinates with a green confirmation badge
- Show geo-deviation warning if expected coordinates are available (from the lead's address)
- GPS is captured once and applied to all photos in the session

### 3. Upload photos with GPS metadata on save/submit
- On "Save Draft" or "Submit", upload all queued photos via the existing `useUploadEvidence` hook
- Each photo gets the same GPS coordinates captured in the form
- Show upload progress indicator for batch uploads
- Already-uploaded evidence (from `useTaskEvidence`) is shown in the gallery above the upload area

### 4. Reuse existing components
- Reuse `EvidenceGallery` (read-only view of uploaded evidence) inside the form
- Reuse the `useUploadEvidence` mutation and GPS calculation logic from `EvidenceUploadForm`
- No backend or database changes needed -- all existing tables and storage buckets support this

## Files to Modify
- **`src/components/tasks/FieldVerificationForm.tsx`** -- Add GPS capture section, multi-photo upload area with previews, integrate `EvidenceGallery`, and batch upload on save/submit
- **`src/pages/tasks/MyTasksPage.tsx`** -- Pass `expectedLatitude`/`expectedLongitude` from lead address data if available

## No backend changes required
The `task_evidence` table, `task-evidence` storage bucket, and `useUploadEvidence` hook already handle everything needed.

