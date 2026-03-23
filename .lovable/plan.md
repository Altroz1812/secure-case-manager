

# PDF Report Configuration Engine

## Problem
The current Report Config page is a raw JSON editor -- users must type JSON to configure report templates. There's no visual builder for creating report layouts with blocks, sections, headers, tables, logos, etc. Financial services verification reports (CPV, BGV, FI, ITR) each have distinct section requirements that need a proper drag-and-drop style configuration engine.

## Approach
Replace the raw JSON form with a **visual block-based report template builder** stored in the existing `client_report_configs` table's `template_config` JSONB column. No database schema changes needed.

## Design

### Block Types
Each report template is an ordered array of blocks. Supported block types:

| Block Type | Description | Use Case |
|-----------|-------------|----------|
| `header` | Company/client logo, report title, subtitle, date | Top of every report |
| `client_logo` | Client logo with configurable position/size | Brand identity |
| `section_title` | Section heading with optional divider | "Applicant Details", "Verification Summary" |
| `key_value_table` | Label-value pairs in 2-column layout | Applicant info, loan details |
| `data_table` | Multi-column table with dynamic rows | Employment history, reference checks |
| `text_block` | Rich text / paragraph content | Remarks, findings, disclaimers |
| `photo_grid` | Evidence photos grid with captions | Site visit photos |
| `signature_block` | Signature lines with name/designation | Verifier, approver signatures |
| `spacer` | Vertical spacing between sections | Layout control |
| `divider` | Horizontal rule | Visual separation |

### Data Field Mapping
Each block can reference dynamic fields from the verification data:
- `{{applicant_name}}`, `{{application_number}}`, `{{address}}`
- `{{verification_type}}`, `{{verification_date}}`, `{{verifier_name}}`
- `{{checklist_results}}`, `{{observation_tags}}`, `{{remarks}}`
- `{{evidence_photos}}`, `{{geo_coordinates}}`

### Verification Type Presets
Pre-built templates for common financial services verification types:
- **CPV** (Contact Point Verification) -- phone verification table, contact details
- **BGV** (Background Verification) -- employment history, education, criminal check sections  
- **FI** (Field Investigation) -- residence/business visit details, photo evidence, neighbour checks
- **ITR** (Income Tax Return) -- income details, tax filing summary

## Files to Create/Modify

### New Components
- **`src/components/reports/ReportTemplateBuilder.tsx`** -- Main builder UI with block list, add/remove/reorder blocks, block property editors
- **`src/components/reports/ReportBlockEditor.tsx`** -- Per-block configuration panel (fields vary by block type)
- **`src/components/reports/ReportPreview.tsx`** -- Live HTML preview of the configured template with sample data
- **`src/components/reports/ReportBlockPalette.tsx`** -- Block type palette for adding new blocks (drag or click to add)

### Modified Files
- **`src/pages/admin/ReportConfigPage.tsx`** -- Replace raw JSON forms with the visual builder; add preset templates; add preview panel
- **`src/hooks/useClientReportConfigs.ts`** -- No changes needed (already stores/retrieves JSONB)
- **`supabase/functions/generate-pdf-report/index.ts`** -- Update to read the block-based `template_config` and render each block type into HTML sections dynamically

### Template Data Structure (stored in `template_config` JSONB)
```json
{
  "pageSize": "A4",
  "orientation": "portrait",
  "margins": { "top": 40, "right": 30, "bottom": 40, "left": 30 },
  "blocks": [
    {
      "id": "uuid",
      "type": "header",
      "config": {
        "title": "Field Investigation Report",
        "subtitle": "{{client_name}}",
        "showDate": true,
        "showLogo": true,
        "logoPosition": "left"
      }
    },
    {
      "id": "uuid",
      "type": "key_value_table",
      "config": {
        "title": "Applicant Details",
        "columns": 2,
        "fields": [
          { "label": "Name", "field": "{{applicant_name}}" },
          { "label": "Application No.", "field": "{{application_number}}" }
        ]
      }
    }
  ]
}
```

## UI Layout
The builder page will have a **two-panel layout**:
- **Left panel (60%)**: Block list with reorder (up/down buttons), inline editing of block properties, add block button opening the palette
- **Right panel (40%)**: Live preview rendering the template with sample data

## Summary
- No database migration needed -- uses existing `template_config` JSONB
- 4 new component files for the builder UI
- 1 page rewrite (ReportConfigPage)
- 1 edge function update (generate-pdf-report) to render block-based templates
- Includes presets for CPV, BGV, FI, ITR verification types

