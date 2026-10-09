# EAGLE EYE — Feature Tickets

## Document Overview

**Product:** EAGLE EYE  
**Document Type:** Development Feature Backlog  
**Version:** 1.0  
**Status:** Hackathon Implementation Backlog

This document converts the EAGLE EYE PRD and technical/frontend specifications into independently implementable feature tickets.

The goal is to provide the development team with a clear backlog that can be used for implementation, testing, integration, and hackathon demonstration.

---

# 1. Ticket Structure

Every ticket contains:

- Feature ID
- Epic
- Title
- Priority
- User Story
- Description
- Inputs
- Outputs
- Dependencies
- Technical Notes
- Acceptance Criteria
- Definition of Done
- Testing Requirements

---

# 2. Priority Definitions

| Priority | Meaning |
|---|---|
| P0 | Critical for the core hackathon solution |
| P1 | Important for a complete working product |
| P2 | Stretch / enhancement |

---

# 3. Epic Overview

```text
EPIC 1 — Project & Input Management
EPIC 2 — Engineering Intelligence
EPIC 3 — Computer Vision
EPIC 4 — QC Intelligence
EPIC 5 — Evidence & Reporting
EPIC 6 — Re-check & History
EPIC 7 — Frontend
EPIC 8 — Validation & Hackathon Readiness
```

---

# EPIC 1 — Project & Input Management

---

## FEAT-001 — Project Creation

**Epic:** Project & Input Management  
**Priority:** P0

### User Story

As a QC inspector, I want to create an inspection project so that all engineering files, inspections, results, and history remain associated with the correct cabinet/project.

### Description

Create a project/container for a cabinet inspection.

### Inputs

- Project name
- Cabinet/project identifier

### Outputs

- Project ID
- Project record

### Dependencies

None.

### Acceptance Criteria

- [ ] User can create a project.
- [ ] Project receives a unique ID.
- [ ] Project can be opened later.
- [ ] Project can contain multiple inspections.
- [ ] Project creation errors are clearly displayed.

### Definition of Done

- Project creation works through the UI.
- Project is persisted.
- Project ID is available to the inspection pipeline.

### Testing

- Create valid project.
- Attempt empty project name.
- Create multiple projects.
- Verify unique IDs.

---

## FEAT-002 — Cabinet Photo Upload

**Epic:** Project & Input Management  
**Priority:** P0

### User Story

As a QC inspector, I want to upload the cabinet photograph so that EAGLE EYE can inspect the physical cabinet.

### Acceptance Criteria

- [ ] JPG and PNG are supported.
- [ ] File size is validated.
- [ ] Image preview is displayed.
- [ ] Image dimensions are detected.
- [ ] Invalid files are rejected.
- [ ] Uploaded image is associated with the inspection.

### Definition of Done

A valid cabinet photo can be uploaded and passed to the inspection pipeline.

### Testing

- Valid JPG.
- Valid PNG.
- Corrupt image.
- Unsupported format.
- Low-resolution image.

---

## FEAT-003 — GA Drawing Upload

**Epic:** Project & Input Management  
**Priority:** P0

### User Story

As a QC inspector, I want to upload the GA drawing so that the system can determine what the cabinet should contain.

### Acceptance Criteria

- [ ] PDF is accepted.
- [ ] PDF metadata is extracted.
- [ ] File can be passed to the GA parser.
- [ ] Parser errors are shown clearly.

### Definition of Done

A valid GA PDF reaches the document intelligence pipeline.

---

## FEAT-004 — Excel Wire / Label List Upload

**Epic:** Project & Input Management  
**Priority:** P0

### User Story

As a QC inspector, I want to upload the Excel wire/label list so that the system can validate labels, wires, terminals, and ferrules.

### Acceptance Criteria

- [ ] XLSX is accepted.
- [ ] Workbook/sheet information is detected.
- [ ] Relevant columns can be identified.
- [ ] Parsing errors are displayed.
- [ ] Excel data is passed to the normalization layer.

### Definition of Done

Excel data can be converted into normalized engineering records.

---

## FEAT-005 — Input Validation

**Epic:** Project & Input Management  
**Priority:** P0

### User Story

As a QC inspector, I want the system to validate all uploaded files before inspection so that invalid input does not produce misleading results.

### Acceptance Criteria

- [ ] Cabinet photo is validated.
- [ ] GA PDF is validated.
- [ ] Excel file is validated.
- [ ] QC checklist is validated.
- [ ] Missing inputs are identified.
- [ ] Parsing warnings are shown.
- [ ] User cannot start inspection when critical inputs are invalid.

### Definition of Done

The system provides a clear Ready / Warning / Error state for every required input.

---

# EPIC 2 — Engineering Intelligence

---

## FEAT-006 — GA Drawing Parser

**Epic:** Engineering Intelligence  
**Priority:** P0

### User Story

As the inspection system, I need to extract engineering information from the GA drawing so that an expected cabinet can be constructed.

### Inputs

- GA PDF

### Outputs

- Component IDs
- Component types where inferable
- Page/source
- Position information
- Extraction confidence

### Dependencies

FEAT-003

### Acceptance Criteria

- [ ] PDF text is extracted where available.
- [ ] OCR fallback is available for image-based pages.
- [ ] Engineering tags are detected.
- [ ] Duplicate tags are handled.
- [ ] Source page is retained.
- [ ] Extraction confidence is retained.

### Definition of Done

A representative GA drawing produces structured component records.

### Testing

- Text-based PDF.
- Scanned PDF.
- Duplicate labels.
- Low-quality page.

---

## FEAT-007 — Excel Parser

**Epic:** Engineering Intelligence  
**Priority:** P0

### User Story

As the inspection system, I need to extract wire, label, terminal, and ferrule information from Excel.

### Acceptance Criteria

- [ ] Workbook can be loaded.
- [ ] Relevant sheet can be selected/detected.
- [ ] Column names are normalized.
- [ ] Component records are created.
- [ ] Wire records are created.
- [ ] Ferrule information is retained.
- [ ] Unknown columns do not crash the parser.

### Definition of Done

A real wire/label spreadsheet can be transformed into normalized records.

---

## FEAT-008 — Expected Cabinet Model

**Epic:** Engineering Intelligence  
**Priority:** P0

### User Story

As the inspection engine, I need a normalized Expected Cabinet Model so that engineering documents can be compared with physical observations.

### Model Should Contain

```text
Component ID
Component Type
Label
Expected Position
Order
Wire Relationships
Ferrule Expectations
Source
Confidence
```

### Dependencies

FEAT-006  
FEAT-007

### Acceptance Criteria

- [ ] GA and Excel information can be merged.
- [ ] Components have stable IDs.
- [ ] Source provenance is retained.
- [ ] Conflicts are detected.
- [ ] Missing information is represented explicitly.
- [ ] Model can be serialized to JSON.

### Definition of Done

The inspection engine can consume the Expected Cabinet Model without directly reading raw PDF/Excel files.

---

## FEAT-009 — Engineering Data Conflict Detection

**Epic:** Engineering Intelligence  
**Priority:** P1

### User Story

As an engineer, I want conflicts between the GA and Excel data to be identified before inspection.

### Example

```text
GA:
PS12

Excel:
PS13
```

### Acceptance Criteria

- [ ] Conflicting IDs are detected.
- [ ] Conflicting labels are detected.
- [ ] Missing cross-references are detected.
- [ ] Conflicts are shown to the user.
- [ ] Conflicts do not silently overwrite data.

---

# EPIC 3 — Computer Vision

---

## FEAT-010 — Cabinet Image Preprocessing

**Epic:** Computer Vision  
**Priority:** P0

### User Story

As the vision engine, I need a normalized cabinet image so that detection and spatial comparison are reliable.

### Processing

```text
Input Photo
   ↓
Quality Check
   ↓
Crop / ROI
   ↓
Perspective Correction
   ↓
Lighting / Contrast Normalization
   ↓
Inspection Image
```

### Acceptance Criteria

- [ ] Image quality is checked.
- [ ] Cabinet region can be identified or selected.
- [ ] Image is normalized.
- [ ] Original image remains unchanged.
- [ ] Preprocessed image can be saved.

---

## FEAT-011 — Component Detection

**Epic:** Computer Vision  
**Priority:** P0

### User Story

As a QC inspector, I want EAGLE EYE to detect physical cabinet components so that their presence and location can be checked.

### Initial Classes

```text
power_supply
breaker
terminal_block
baseplate
controller
earth_bar
```

Additional classes can be added later.

### Outputs

```text
class
bbox
confidence
position
```

### Acceptance Criteria

- [ ] Multiple components can be detected.
- [ ] Bounding boxes are returned.
- [ ] Confidence scores are returned.
- [ ] Multiple instances of the same type are supported.
- [ ] Model does not depend on hard-coded component IDs.
- [ ] Low-confidence detections can be marked REVIEW.

### Definition of Done

A trained or validated detector can process a real cabinet photograph.

---

## FEAT-012 — Component Label OCR

**Epic:** Computer Vision  
**Priority:** P0

### User Story

As a QC inspector, I want device labels to be read automatically so that the detected component can be matched with the expected engineering tag.

### Acceptance Criteria

- [ ] OCR is run on component crops.
- [ ] Engineering tags are extracted.
- [ ] OCR confidence is retained.
- [ ] Multiple OCR preprocessing methods can be used where required.
- [ ] OCR output is associated with a component detection.

---

## FEAT-013 — Ferrule Detection and OCR

**Epic:** Computer Vision  
**Priority:** P0

### User Story

As a QC inspector, I want the system to identify and read ferrules so that wire-end labels can be checked.

### Acceptance Criteria

- [ ] Ferrule regions can be detected where visually observable.
- [ ] Ferrule text can be OCR'd.
- [ ] Expected ferrule text can be compared with observed text.
- [ ] Missing ferrules can be identified where evidence is sufficient.
- [ ] Low-quality ferrule evidence can result in REVIEW.

---

## FEAT-014 — Spatial / Position Analysis

**Epic:** Computer Vision  
**Priority:** P0

### User Story

As a QC inspector, I want the system to determine where components are located so that incorrect placement and ordering can be detected.

### Acceptance Criteria

- [ ] Component positions are normalized.
- [ ] Expected and observed coordinates can be compared.
- [ ] Position tolerance is configurable.
- [ ] Component order can be derived for applicable groups.
- [ ] Perspective differences are considered.

---

# EPIC 4 — QC Intelligence

---

## FEAT-015 — Component Presence Check

**Epic:** QC Intelligence  
**Priority:** P0

### User Story

As a QC inspector, I want the system to detect missing components.

### Example

```text
Expected:
PS12

Found:
Missing

Result:
FAIL
```

### Acceptance Criteria

- [ ] Every required expected component is checked.
- [ ] Missing components produce FAIL when evidence is sufficient.
- [ ] Uncertain observations can produce REVIEW.
- [ ] Evidence is linked to the result.

---

## FEAT-016 — Position / Order Check

**Epic:** QC Intelligence  
**Priority:** P0

### User Story

As a QC inspector, I want the system to detect components that are in the wrong location or sequence.

### Example

```text
Expected:
CB41 → CB42 → CB43 → CB44

Found:
CB41 → CB42 → CB44 → CB43

Result:
FAIL
```

### Acceptance Criteria

- [ ] Expected order is extracted.
- [ ] Observed order is calculated.
- [ ] Order mismatches are identified.
- [ ] Position deviations can be detected.
- [ ] Expected and found order are displayed.

---

## FEAT-017 — Label Check

**Epic:** QC Intelligence  
**Priority:** P0

### User Story

As a QC inspector, I want the system to verify that component labels match the engineering information.

### Acceptance Criteria

- [ ] Expected label is loaded.
- [ ] Observed label is obtained through OCR.
- [ ] Labels are compared.
- [ ] Missing labels are detected.
- [ ] Incorrect labels are detected.
- [ ] Low-confidence OCR produces REVIEW where appropriate.

---

## FEAT-018 — Ferrule Check

**Epic:** QC Intelligence  
**Priority:** P0

### User Story

As a QC inspector, I want the system to verify ferrule presence and text.

### Acceptance Criteria

- [ ] Expected ferrule is obtained from engineering data.
- [ ] Observed ferrule is detected/read.
- [ ] Missing ferrules produce FAIL where evidence is sufficient.
- [ ] Wrong ferrule text produces FAIL.
- [ ] Ambiguous ferrule evidence produces REVIEW.

---

## FEAT-019 — Wire / Terminal Check

**Epic:** QC Intelligence  
**Priority:** P1

### User Story

As a QC inspector, I want to verify wire color, terminal, and module relationships.

### Acceptance Criteria

- [ ] Wire color can be detected where supported.
- [ ] Terminal information can be identified where visible.
- [ ] Expected and observed relationships can be compared.
- [ ] Unsupported/uncertain cases are not falsely marked FAIL.

---

## FEAT-020 — PASS / FAIL / REVIEW Engine

**Epic:** QC Intelligence  
**Priority:** P0

### User Story

As a QC inspector, I want every check to produce a clear status.

### Rules

```text
PASS:
Evidence satisfies the requirement.

FAIL:
Definite mismatch or missing requirement.

REVIEW:
Evidence is ambiguous or confidence is insufficient.
```

### Acceptance Criteria

- [ ] Every configured check receives a status.
- [ ] Status is based on configured rules.
- [ ] Confidence is retained.
- [ ] Overall inspection status is calculated.
- [ ] Mandatory FAIL causes overall FAIL.
- [ ] REVIEW is shown when no FAIL exists but mandatory checks remain uncertain.

---

# EPIC 5 — Evidence & Reporting

---

## FEAT-021 — Annotated Inspection Photo

**Epic:** Evidence & Reporting  
**Priority:** P0

### User Story

As a QC inspector, I want failures marked directly on the cabinet photo.

### Acceptance Criteria

- [ ] FAIL components are boxed.
- [ ] Issue number is displayed.
- [ ] Relevant label/description can be displayed.
- [ ] Original image remains unchanged.
- [ ] Annotated image can be downloaded.

---

## FEAT-022 — Evidence Snippets

**Epic:** Evidence & Reporting  
**Priority:** P0

### User Story

As a QC inspector, I want a zoomed image for every FAIL so that I can verify the issue.

### Acceptance Criteria

- [ ] Every FAIL has an evidence crop where visual evidence exists.
- [ ] Crop contains the relevant component/region.
- [ ] Evidence is linked to the check ID.
- [ ] Evidence can be opened from the UI.

---

## FEAT-023 — Expected vs Found Comparison

**Epic:** Evidence & Reporting  
**Priority:** P0

### User Story

As a QC inspector, I want to see expected and found values side by side.

### Example

```text
EXPECTED             FOUND

CB41-42-43-44        CB41-42-44-43

                    FAIL
```

### Acceptance Criteria

- [ ] Expected value is displayed.
- [ ] Found value is displayed.
- [ ] Difference is clearly identified.
- [ ] Result is displayed.
- [ ] Confidence is available where relevant.

---

## FEAT-024 — QC Checklist

**Epic:** Evidence & Reporting  
**Priority:** P0

### User Story

As a QC inspector, I want the system to automatically populate the QC checklist.

### Acceptance Criteria

- [ ] All configured checks appear.
- [ ] Every check has PASS/FAIL/REVIEW.
- [ ] Expected and found values are shown.
- [ ] Evidence can be opened.
- [ ] Checklist can be filtered.
- [ ] Checklist can be exported.

---

## FEAT-025 — Report Export

**Epic:** Evidence & Reporting  
**Priority:** P0

### User Story

As a QC inspector, I want to export the inspection results for documentation.

### Outputs

```text
Excel
PDF
Annotated photos
Evidence snippets
```

### Acceptance Criteria

- [ ] Report contains inspection ID.
- [ ] Report contains overall status.
- [ ] Report contains all QC checks.
- [ ] Expected vs Found is included.
- [ ] FAIL evidence references are included.
- [ ] Report can be downloaded.

---

# EPIC 6 — Re-check & History

---

## FEAT-026 — Re-check Inspection

**Epic:** Re-check & History  
**Priority:** P0

### User Story

As a technician, I want to upload a new cabinet photo after fixing an issue so that EAGLE EYE can verify the correction.

### Acceptance Criteria

- [ ] User can select an existing inspection.
- [ ] User can upload a new photo.
- [ ] Same Expected Cabinet Model is reused.
- [ ] Previously failed checks can be re-run.
- [ ] New results are associated with the previous inspection.

---

## FEAT-027 — Issue Lifecycle

**Epic:** Re-check & History  
**Priority:** P0

### States

```text
OPEN
  ↓
RECHECKED
  ↓
CLOSED
```

### Acceptance Criteria

- [ ] Failed issues start as OPEN.
- [ ] Re-check updates issue status.
- [ ] Passing re-check closes the issue.
- [ ] Failing re-check keeps issue OPEN.
- [ ] Closed issues retain their original evidence.

---

## FEAT-028 — Before / After Comparison

**Epic:** Re-check & History  
**Priority:** P1

### User Story

As a QC inspector, I want to compare the original and corrected cabinet photos.

### Acceptance Criteria

- [ ] Before image is available.
- [ ] After image is available.
- [ ] Side-by-side view is supported.
- [ ] Issue status changes are shown.
- [ ] Closed and remaining issues are clearly distinguished.

---

## FEAT-029 — Inspection History

**Epic:** Re-check & History  
**Priority:** P1

### User Story

As a supervisor, I want to see inspection history so that I can track cabinet QC progress.

### Acceptance Criteria

- [ ] Previous inspections are listed.
- [ ] Inspection date/time is shown.
- [ ] Cabinet/project ID is shown.
- [ ] Overall result is shown.
- [ ] Inspection can be opened.
- [ ] Re-check relationships are preserved.

---

# EPIC 7 — Frontend

---

## FEAT-030 — Dashboard

**Epic:** Frontend  
**Priority:** P1

### User Story

As a supervisor, I want a dashboard showing inspection activity and current issues.

### Display

```text
Total Inspections
PASS
FAIL
REVIEW
Open Issues
Recent Inspections
```

### Acceptance Criteria

- [ ] Summary metrics are displayed.
- [ ] Recent inspections are listed.
- [ ] User can open an inspection.
- [ ] New Inspection action is prominent.

---

## FEAT-031 — New Inspection UI

**Epic:** Frontend  
**Priority:** P0

### User Story

As a QC inspector, I want a simple guided workflow for uploading inspection inputs.

### Acceptance Criteria

- [ ] Photo upload is visible.
- [ ] GA upload is visible.
- [ ] Excel upload is visible.
- [ ] Checklist selection is visible.
- [ ] File status is shown.
- [ ] Validation can be started.
- [ ] Inspection can be started after validation.

---

## FEAT-032 — Inspection Results UI

**Epic:** Frontend  
**Priority:** P0

### User Story

As a QC inspector, I want to see the overall inspection result and individual issues.

### Acceptance Criteria

- [ ] PASS count is displayed.
- [ ] FAIL count is displayed.
- [ ] REVIEW count is displayed.
- [ ] Overall result is prominent.
- [ ] Issue list is displayed.
- [ ] Selecting an issue opens its details.

---

## FEAT-033 — Evidence Viewer

**Epic:** Frontend  
**Priority:** P0

### User Story

As a QC inspector, I want to inspect the exact visual evidence behind a failure.

### Features

```text
Zoom
Pan
Bounding Boxes
Issue Markers
Evidence Snippets
Expected vs Found
```

### Acceptance Criteria

- [ ] Annotated photo loads.
- [ ] FAIL markers are visible.
- [ ] Clicking a marker opens issue details.
- [ ] Zoom is supported.
- [ ] Evidence snippet can be opened.

---

## FEAT-034 — QC Checklist UI

**Epic:** Frontend  
**Priority:** P0

### User Story

As a QC inspector, I want to review every QC check in a structured checklist.

### Acceptance Criteria

- [ ] All checks are listed.
- [ ] Status badges are visible.
- [ ] Expected/Found values are visible.
- [ ] Results can be filtered.
- [ ] Evidence can be opened.
- [ ] Export action is available.

---

## FEAT-035 — Re-check UI

**Epic:** Frontend  
**Priority:** P0

### User Story

As a technician, I want to start a re-check from a previous failed inspection.

### Acceptance Criteria

- [ ] Open issues are displayed.
- [ ] New photo upload is available.
- [ ] Re-check can be started.
- [ ] Before/after results are displayed.
- [ ] Closed issues are clearly marked.
- [ ] Remaining issues are clearly marked.

---

# EPIC 8 — Validation & Hackathon Readiness

---

## FEAT-036 — Sample Fault Validation

**Epic:** Validation & Hackathon Readiness  
**Priority:** P0

### User Story

As the development team, we need to validate the system against the supplied planted faults.

### Required Faults

```text
1. PS12 missing
2. CB43 / CB44 swapped
3. 1CBP03 label missing
4. X3 ferrule missing
```

### Acceptance Criteria

- [ ] PS12 is detected as missing.
- [ ] CB43/CB44 order mismatch is detected.
- [ ] 1CBP03 missing label is detected.
- [ ] X3 missing ferrule is detected.
- [ ] Each failure has evidence.
- [ ] Correct items are not incorrectly marked FAIL.

---

## FEAT-037 — Fresh Cabinet Validation

**Epic:** Validation & Hackathon Readiness  
**Priority:** P0

### User Story

As the hackathon evaluator, I want the system to work on a cabinet it has not been hard-coded for.

### Acceptance Criteria

- [ ] No sample-specific fault logic is used.
- [ ] Expected model comes from uploaded engineering files.
- [ ] Component detection works on an unseen cabinet.
- [ ] Rules operate from the expected model.
- [ ] Report is generated without manual editing.

---

## FEAT-038 — False Positive Testing

**Epic:** Validation & Hackathon Readiness  
**Priority:** P0

### User Story

As a QC inspector, I need confidence that correct components are not incorrectly marked FAIL.

### Metrics

```text
False Fail Rate
False Positive Rate
Detection Precision
Detection Recall
OCR Accuracy
```

### Acceptance Criteria

- [ ] Correct components are tested.
- [ ] OCR uncertainty is tested.
- [ ] Occlusion is tested.
- [ ] Position tolerance is tested.
- [ ] Results are documented.

---

## FEAT-039 — Live Demo Workflow

**Epic:** Validation & Hackathon Readiness  
**Priority:** P0

### User Story

As the hackathon team, we need a reliable five-minute demonstration of the complete EAGLE EYE workflow.

### Demo Flow

```text
1. Upload inputs
       ↓
2. Validate
       ↓
3. Build Expected Model
       ↓
4. Run inspection
       ↓
5. Show FAIL results
       ↓
6. Open evidence
       ↓
7. Show Expected vs Found
       ↓
8. Upload corrected photo
       ↓
9. Re-check
       ↓
10. Show closed issues
```

### Acceptance Criteria

- [ ] Demo can run from clean project state.
- [ ] No manual editing of generated results.
- [ ] All required outputs are visible.
- [ ] Re-check works.
- [ ] Demo can be completed within approximately five minutes.

---

# 4. Recommended Development Sequence

The tickets should be implemented in dependency order.

```text
PHASE 1 — FOUNDATION

FEAT-001
FEAT-002
FEAT-003
FEAT-004
FEAT-005
        ↓
PHASE 2 — ENGINEERING MODEL

FEAT-006
FEAT-007
FEAT-008
FEAT-009
        ↓
PHASE 3 — VISION

FEAT-010
FEAT-011
FEAT-012
FEAT-013
FEAT-014
        ↓
PHASE 4 — QC

FEAT-015
FEAT-016
FEAT-017
FEAT-018
FEAT-020
        ↓
PHASE 5 — EVIDENCE

FEAT-021
FEAT-022
FEAT-023
FEAT-024
FEAT-025
        ↓
PHASE 6 — RE-CHECK

FEAT-026
FEAT-027
FEAT-028
FEAT-029
        ↓
PHASE 7 — FRONTEND

FEAT-030
FEAT-031
FEAT-032
FEAT-033
FEAT-034
FEAT-035
        ↓
PHASE 8 — VALIDATION

FEAT-036
FEAT-037
FEAT-038
FEAT-039
```

---

# 5. MVP Scope

The minimum viable hackathon product should include:

```text
P0 FEATURES

FEAT-001  Project Creation
FEAT-002  Cabinet Photo Upload
FEAT-003  GA Drawing Upload
FEAT-004  Excel Upload
FEAT-005  Input Validation

FEAT-006  GA Parser
FEAT-007  Excel Parser
FEAT-008  Expected Cabinet Model

FEAT-010  Image Preprocessing
FEAT-011  Component Detection
FEAT-012  Label OCR
FEAT-013  Ferrule Detection/OCR
FEAT-014  Spatial Analysis

FEAT-015  Presence Check
FEAT-016  Position/Order Check
FEAT-017  Label Check
FEAT-018  Ferrule Check
FEAT-020  PASS/FAIL/REVIEW

FEAT-021  Annotated Photo
FEAT-022  Evidence Snippets
FEAT-023  Expected vs Found
FEAT-024  QC Checklist
FEAT-025  Report Export

FEAT-026  Re-check
FEAT-027  Issue Lifecycle

FEAT-031  New Inspection UI
FEAT-032  Results UI
FEAT-033  Evidence Viewer
FEAT-034  Checklist UI
FEAT-035  Re-check UI

FEAT-036  Sample Validation
FEAT-037  Fresh Cabinet Validation
FEAT-038  False Positive Testing
FEAT-039  Live Demo
```

---

# 6. Stretch Scope

After the MVP works:

```text
FEAT-009   Engineering Conflict Detection
FEAT-019   Wire / Terminal Check
FEAT-028   Before / After Comparison
FEAT-029   Inspection History
FEAT-030   Dashboard
```

Additional future capabilities:

```text
Advanced wire-color detection
Advanced terminal verification
Improved ferrule OCR
Cloud deployment
User authentication
Role-based access
Model monitoring
Active learning
Analytics
Multi-cabinet projects
```

---

# 7. Ticket Dependency Map

```text
                    FEAT-001
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    FEAT-002       FEAT-003       FEAT-004
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                   FEAT-005
                       │
              ┌────────┴────────┐
              ▼                 ▼
          FEAT-006          FEAT-007
              │                 │
              └────────┬────────┘
                       ▼
                   FEAT-008
                       │
                       ▼
                   FEAT-010
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
          FEAT-011 FEAT-012 FEAT-013
              │        │        │
              └────────┼────────┘
                       ▼
                   FEAT-014
                       │
                       ▼
              ┌────────┼─────────┐
              ▼        ▼         ▼
          FEAT-015 FEAT-016 FEAT-017
                       │
                       ▼
                   FEAT-018
                       │
                       ▼
                   FEAT-020
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      FEAT-021      FEAT-022     FEAT-023
          │            │            │
          └────────────┼────────────┘
                       ▼
                   FEAT-024
                       │
                       ▼
                   FEAT-025
                       │
                       ▼
                   FEAT-026
                       │
                       ▼
                   FEAT-027
                       │
                       ▼
                   FEAT-028
                       │
                       ▼
                   FEAT-029
```

---

# 8. Definition of Done — Product Level

EAGLE EYE is considered ready for the hackathon demonstration when:

- [ ] User can upload cabinet photo.
- [ ] User can upload GA drawing.
- [ ] User can upload Excel wire/label list.
- [ ] Engineering inputs are converted into an Expected Cabinet Model.
- [ ] Cabinet image is processed by the vision pipeline.
- [ ] Components can be detected.
- [ ] Labels can be read.
- [ ] Ferrules can be checked.
- [ ] Presence can be checked.
- [ ] Position/order can be checked.
- [ ] Results are PASS/FAIL/REVIEW.
- [ ] Every FAIL has visual evidence.
- [ ] Expected vs Found is visible.
- [ ] QC checklist is generated.
- [ ] Report can be exported.
- [ ] Re-check can be performed.
- [ ] Fixed issues can be closed.
- [ ] Unresolved issues remain open.
- [ ] Sample planted faults are detected.
- [ ] Fresh/unseen cabinet testing is possible.
- [ ] No hard-coded sample fault logic is used.

---

# 9. Team Ownership Recommendation

For a small hackathon team, divide ownership by technical domain rather than assigning every feature independently.

```text
TEAM MEMBER / ROLE              PRIMARY TICKETS

Backend / Architecture
    FEAT-001 → FEAT-009
    FEAT-020
    FEAT-026 → FEAT-029

Computer Vision / ML
    FEAT-010 → FEAT-019

Frontend
    FEAT-021 → FEAT-025
    FEAT-030 → FEAT-035

QA / Integration
    FEAT-036 → FEAT-039
```

Cross-team integration should happen continuously rather than waiting until the end.

---

# 10. Suggested Git Branch Naming

Use one branch per feature:

```text
feature/FEAT-001-project-creation
feature/FEAT-002-photo-upload
feature/FEAT-006-ga-parser
feature/FEAT-008-expected-model
feature/FEAT-011-component-detection
feature/FEAT-020-qc-engine
feature/FEAT-021-annotated-photo
feature/FEAT-026-recheck
```

Bug fixes:

```text
fix/ocr-confidence
fix/ga-parser-position
fix/evidence-crop
fix/recheck-status
```

---

# 11. Recommended Ticket Statuses

```text
BACKLOG
   ↓
READY
   ↓
IN PROGRESS
   ↓
CODE REVIEW
   ↓
TESTING
   ↓
DONE
```

For blocked work:

```text
BLOCKED
```

A ticket should not be marked DONE until its acceptance criteria and testing requirements are satisfied.

---

# 12. Final Backlog

```text
39 FEATURE TICKETS

EPIC 1 — Project & Input Management
001 Project Creation
002 Cabinet Photo Upload
003 GA Drawing Upload
004 Excel Upload
005 Input Validation

EPIC 2 — Engineering Intelligence
006 GA Drawing Parser
007 Excel Parser
008 Expected Cabinet Model
009 Engineering Conflict Detection

EPIC 3 — Computer Vision
010 Image Preprocessing
011 Component Detection
012 Label OCR
013 Ferrule Detection/OCR
014 Spatial Analysis

EPIC 4 — QC Intelligence
015 Component Presence
016 Position / Order
017 Label Check
018 Ferrule Check
019 Wire / Terminal Check
020 PASS / FAIL / REVIEW

EPIC 5 — Evidence & Reporting
021 Annotated Photo
022 Evidence Snippets
023 Expected vs Found
024 QC Checklist
025 Report Export

EPIC 6 — Re-check & History
026 Re-check
027 Issue Lifecycle
028 Before / After
029 Inspection History

EPIC 7 — Frontend
030 Dashboard
031 New Inspection UI
032 Results UI
033 Evidence Viewer
034 Checklist UI
035 Re-check UI

EPIC 8 — Validation
036 Sample Fault Validation
037 Fresh Cabinet Validation
038 False Positive Testing
039 Live Demo Workflow
```

---

# 13. Product Build Philosophy

The tickets should be implemented around the following architecture:

```text
                    ENGINEERING INPUTS
                           │
                           ▼
                  EXPECTED MODEL
                           │
                           │
CABINET PHOTO ─────► VISION MODEL
                           │
                           ▼
                   OBSERVED MODEL
                           │
                           ▼
                    MATCHING ENGINE
                           │
                           ▼
                     QC ENGINE
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
              PASS       FAIL       REVIEW
                           │
                           ▼
                       EVIDENCE
                           │
                           ▼
                         REPORT
                           │
                           ▼
                        RE-CHECK
```

The AI model should identify and interpret what is physically visible. The engineering model defines what should exist. The QC engine makes the final rule-based decision. The frontend exposes that decision and its evidence to the inspector.

This separation keeps the system modular, testable, explainable, and suitable for extending beyond the initial planted-fault examples.
