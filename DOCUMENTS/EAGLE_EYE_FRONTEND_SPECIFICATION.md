# EAGLE EYE — Frontend Specification

## 1. Document Overview

**Product:** EAGLE EYE  
**Module:** Frontend / Web Dashboard  
**Document Type:** Frontend Specification  
**Version:** 1.0  
**Status:** Hackathon MVP Specification

EAGLE EYE is an AI-assisted electrical cabinet quality-control system. The frontend provides the interface through which a QC inspector or technician uploads engineering inputs, runs an inspection, reviews PASS/FAIL/REVIEW results, examines visual evidence, exports reports, and performs re-checks after corrections.

The frontend must make a technically complex AI inspection pipeline feel simple to the user:

```text
UPLOAD
   ↓
UNDERSTAND
   ↓
INSPECT
   ↓
REVIEW
   ↓
FIX
   ↓
RE-CHECK
   ↓
CLOSE
```

---

# 2. Frontend Goals

The frontend must:

1. Provide a simple inspection workflow.
2. Make required inputs obvious.
3. Show whether each uploaded file is valid and ready.
4. Visualize the expected cabinet representation.
5. Present AI inspection results clearly.
6. Make every FAIL traceable to visual evidence.
7. Distinguish PASS, FAIL, and REVIEW states.
8. Show Expected vs Found values.
9. Allow users to inspect individual issues.
10. Support re-check after a physical correction.
11. Preserve inspection history.
12. Provide report export.
13. Avoid requiring electrical engineering expertise to understand the interface.
14. Work well during a live hackathon demonstration.

---

# 3. Recommended Frontend Technology

## MVP

```text
Streamlit
```

Recommended because:

- Fast to implement.
- Native Python integration.
- Easy file uploads.
- Easy image display.
- Easy integration with the existing Python inspection pipeline.
- Suitable for hackathon demonstration.

## Future Production Frontend

```text
Next.js / React
        +
TypeScript
        +
Tailwind CSS
        +
FastAPI backend
```

The UI architecture should therefore be designed so that the Streamlit MVP can later be replaced by React without changing the underlying inspection logic.

---

# 4. Design Principles

## 4.1 Evidence First

The user should never have to guess why an item failed.

Every FAIL should provide:

```text
What was expected?
What was found?
Why did it fail?
Where is the evidence?
```

---

## 4.2 Status at a Glance

The first thing visible after inspection should be:

```text
PASS     FAIL     REVIEW
 18        4        2
```

The overall status should be visually dominant.

---

## 4.3 Progressive Detail

Do not show every technical detail on the first screen.

Recommended information hierarchy:

```text
Level 1:
Overall inspection status

Level 2:
Issue summary

Level 3:
Expected vs Found

Level 4:
Evidence image

Level 5:
Technical confidence / model information
```

---

## 4.4 No Hidden AI Decisions

The UI should expose enough information for the inspector to understand how a decision was reached.

Example:

```text
CB43

Expected:
Position 3

Found:
Position 4

Result:
FAIL

Confidence:
94%

Evidence:
[View on Photo]
```

---

# 5. Application Navigation

Recommended navigation:

```text
┌─────────────────────────────────────────────┐
│ EAGLE EYE                         User      │
├───────────────┬─────────────────────────────┤
│               │                             │
│ Dashboard     │                             │
│               │                             │
│ New Inspection│      PAGE CONTENT           │
│               │                             │
│ Inspections   │                             │
│               │                             │
│ Reports       │                             │
│               │                             │
│ Settings      │                             │
│               │                             │
└───────────────┴─────────────────────────────┘
```

### Navigation Items

```text
Dashboard
New Inspection
Inspections
Reports
Settings
```

For the hackathon MVP, the minimum required navigation is:

```text
New Inspection
Inspections
```

---

# 6. Visual Design System

## 6.1 Overall Style

Recommended visual direction:

```text
Industrial
Clean
Technical
Professional
Evidence-focused
Minimal
```

Avoid a generic consumer-app appearance.

---

# 7. Color Semantics

Colors should communicate status consistently.

### PASS

```text
Green
```

Meaning:

```text
Verified / Correct
```

### FAIL

```text
Red
```

Meaning:

```text
Definite problem
```

### REVIEW

```text
Amber / Orange
```

Meaning:

```text
Human attention required
```

### INFORMATION

```text
Blue
```

Meaning:

```text
System information / neutral action
```

Do not use status colors for decorative elements where they could confuse the meaning.

---

# 8. Typography

Recommended:

```text
Primary:
Inter

Fallback:
Arial / system sans-serif
```

Hierarchy:

```text
Page title
24–32 px

Section heading
18–22 px

Card heading
14–16 px

Body
13–15 px

Technical metadata
11–13 px
```

---

# 9. Core Screens

The frontend consists of:

```text
1. Dashboard
2. New Inspection
3. Input Validation
4. Expected Cabinet Model
5. Inspection Processing
6. Inspection Results
7. Issue Detail / Evidence
8. QC Checklist
9. Re-check
10. Inspection History
11. Report / Export
12. Settings
```

---

# 10. Dashboard

## Purpose

Provide a high-level view of inspection activity.

### Layout

```text
EAGLE EYE
AI Cabinet QC

┌──────────────────────────────────────────────┐
│ Inspections       Open Issues       Pass %   │
│     24                 7             83%     │
└──────────────────────────────────────────────┘

Recent Inspections

┌──────────────────────────────────────────────┐
│ CAB-001     FAIL      04 Oct 2026             │
│ CAB-002     PASS      04 Oct 2026             │
│ CAB-003     REVIEW    03 Oct 2026             │
└──────────────────────────────────────────────┘

             [ + NEW INSPECTION ]
```

### Dashboard Data

Display:

- Total inspections
- PASS inspections
- FAIL inspections
- REVIEW inspections
- Open issues
- Recent inspections
- Latest inspection status

---

# 11. New Inspection Screen

This is the primary entry point.

## Layout

```text
NEW INSPECTION

Step 1 — Upload Inputs

┌──────────────────────────────────────────────┐
│ Cabinet Photo                                │
│                                              │
│       Drag & Drop / Browse                   │
│                                              │
│       JPG / PNG                              │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ GA Drawing                                   │
│                                              │
│       Drag & Drop / Browse                   │
│                                              │
│       PDF                                    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Wire / Label List                            │
│                                              │
│       Drag & Drop / Browse                   │
│                                              │
│       XLSX / XLS                             │
└──────────────────────────────────────────────┘

QC Checklist
[ Default Cabinet QC ▼ ]

                 [ VALIDATE INPUTS ]
```

---

# 12. File Upload Component

Each upload card should display:

### Empty

```text
Upload GA Drawing
PDF
[ Browse File ]
```

### Uploaded

```text
✓ GA_Drawing.pdf

Size:
2.4 MB

Status:
Ready
```

### Error

```text
✕ GA_Drawing.pdf

Unable to parse file.

[ View Details ]
```

---

# 13. Input Validation Screen

Before running AI inspection, validate all inputs.

```text
INPUT VALIDATION

✓ Cabinet photo
✓ GA drawing
✓ Excel wire list
✓ QC checklist

Engineering Data
────────────────────────────

GA components detected: 28
Excel records detected: 34
Potential conflicts: 0

Image
────────────────────────────

Resolution: 4032 × 3024
Quality: Good
Perspective: Acceptable

                [ START INSPECTION ]
```

If validation fails:

```text
⚠ ACTION REQUIRED

GA drawing contains unreadable component labels.

3 items require review.

[ View Parsing Issues ]
```

---

# 14. Expected Cabinet Model Screen

Before inspection, the user should optionally be able to inspect what the system understood from the engineering documents.

## Layout

```text
EXPECTED CABINET

Components: 28
Ferrules: 34
Warnings: 2

┌──────────────────────┐
│                      │
│  EXPECTED CABINET    │
│                      │
│     PS11   PS12      │
│                      │
│ CB41 CB42 CB43 CB44  │
│                      │
│ 1CBP01 ... 1CBP04    │
│                      │
│       X3      PE     │
│                      │
└──────────────────────┘

Component List

PS11   Power Supply
PS12   Power Supply
CB41   Breaker
CB42   Breaker
...
```

This screen is particularly useful for debugging document parsing.

---

# 15. Inspection Processing Screen

When inspection is running:

```text
INSPECTING CABINET

Step 1  ✓ Parse GA
Step 2  ✓ Parse Excel
Step 3  ✓ Build expected model
Step 4  ● Detect components
Step 5  ○ Read labels
Step 6  ○ Check ferrules
Step 7  ○ Compare
Step 8  ○ Generate report

              62%

Please keep this inspection open.
```

Do not show a fake progress percentage if the backend cannot provide real progress.

If the pipeline is not progress-aware, use:

```text
Inspection in progress...

Analyzing cabinet image
```

with an indeterminate progress indicator.

---

# 16. Inspection Results Screen

This is the most important screen.

## Header

```text
INSPECTION RESULT

CAB-001

┌────────────┐ ┌────────────┐ ┌────────────┐
│    PASS    │ │    FAIL    │ │   REVIEW   │
│     18     │ │      4     │ │      2     │
└────────────┘ └────────────┘ └────────────┘

OVERALL RESULT
        FAIL
```

---

# 17. Annotated Cabinet Viewer

Main area:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│           ANNOTATED CABINET PHOTO            │
│                                              │
│     ┌───────┐                                │
│     │ PS12  │ ❌                             │
│     └───────┘                                │
│                                              │
│               CB41 CB42 CB44 CB43            │
│                         ┌────────────┐       │
│                         │ ORDER FAIL │       │
│                         └────────────┘       │
│                                              │
└──────────────────────────────────────────────┘
```

Features:

- Zoom
- Pan
- Bounding boxes
- Issue markers
- Component labels
- Clickable evidence markers
- Reset view

---

# 18. Issue Summary Panel

Beside the image:

```text
ISSUES

❌ PS12
Power supply missing
[ View Evidence ]

❌ CB43 / CB44
Incorrect breaker order
[ View Evidence ]

❌ 1CBP03
Label missing
[ View Evidence ]

❌ X3
Ferrule missing
[ View Evidence ]

⚠ CB42
Low OCR confidence
[ Review ]
```

---

# 19. Issue Detail Screen

When an issue is selected:

```text
ISSUE DETAIL

PS12 — Missing Power Supply

RESULT
FAIL

EXPECTED
PS12
Power supply
Position: 25%

FOUND
Not detected

CONFIDENCE
96%

EVIDENCE

┌──────────────────────────────┐
│                              │
│       ZOOMED PHOTO           │
│                              │
└──────────────────────────────┘

REASON
Expected component was not detected
in the expected cabinet region.

[ BACK TO INSPECTION ]
```

---

# 20. Expected vs Found Component View

Every issue should support a comparison panel.

```text
EXPECTED              FOUND

PS12                  Missing
Power Supply          —
Position 0.25         —

──────────────────────────────

Result: FAIL
```

For order:

```text
EXPECTED ORDER

CB41 → CB42 → CB43 → CB44

FOUND ORDER

CB41 → CB42 → CB44 → CB43

                    ❌ FAIL
```

---

# 21. QC Checklist Screen

The checklist should be filterable.

```text
QC CHECKLIST

Filter:
[ All ▼ ]

────────────────────────────────────────────

Check                    Expected      Result

Power supply PS12        Present       ❌ FAIL
Breaker order            41-42-43-44   ❌ FAIL
Baseplate label          1CBP03        ❌ FAIL
X3 ferrule               Fitted        ❌ FAIL
Earth bar PE             Present       ✓ PASS

────────────────────────────────────────────

[ Export Checklist ]
```

Possible filters:

```text
All
PASS
FAIL
REVIEW
Open
Closed
```

---

# 22. PASS State

PASS should be immediately understandable.

```text
✓ PASS

CB42

Expected:
Breaker CB42

Found:
Breaker CB42

Position:
Correct

Label:
Correct

Confidence:
97%
```

Avoid displaying excessive information for PASS items unless the user expands them.

---

# 23. FAIL State

FAIL requires maximum evidence.

```text
✕ FAIL

X3 Ferrule

Expected:
Ferrule fitted

Found:
No ferrule detected

Confidence:
91%

[ View Photo ]
[ View Snippet ]
```

---

# 24. REVIEW State

REVIEW means the AI does not have enough confidence for an automatic decision.

```text
⚠ REVIEW

CB42 Label

Expected:
CB42

Detected:
CB4?

OCR Confidence:
48%

Reason:
Label partially occluded.

[ Review Evidence ]

[ Mark PASS ]
[ Mark FAIL ]
```

Manual override should require the user to explicitly select the final state.

---

# 25. Re-check Screen

After fixing issues:

```text
RE-CHECK INSPECTION

Previous Inspection:
INS-001

Open Issues:
4

Upload New Cabinet Photo

┌──────────────────────────────────┐
│                                  │
│       Drop corrected photo       │
│                                  │
└──────────────────────────────────┘

              [ RUN RE-CHECK ]
```

---

# 26. Re-check Results

Show before and after.

```text
RE-CHECK RESULT

                 BEFORE       AFTER

PS12             ❌ FAIL      ✓ PASS
CB43/44          ❌ FAIL      ✓ PASS
1CBP03           ❌ FAIL      ✓ PASS
X3 Ferrule       ❌ FAIL      ❌ FAIL

────────────────────────────────────

3 Issues Closed
1 Issue Open

Overall:
FAIL
```

---

# 27. Issue Lifecycle

Each issue should have a lifecycle:

```text
OPEN
  ↓
FIXED / RE-CHECKED
  ↓
CLOSED
```

If still incorrect:

```text
OPEN
  ↓
RE-CHECK
  ↓
OPEN
```

---

# 28. Inspection History Screen

```text
INSPECTION HISTORY

┌────────────────────────────────────────────────┐
│ ID       Cabinet    Result    Date             │
├────────────────────────────────────────────────┤
│ INS-004  CAB-001    PASS      04 Oct 2026      │
│ INS-003  CAB-001    FAIL      04 Oct 2026      │
│ INS-002  CAB-002    PASS      03 Oct 2026      │
└────────────────────────────────────────────────┘
```

Selecting an inspection opens:

```text
Inspection Details
Results
Evidence
Report
Re-check History
```

---

# 29. Before / After Comparison

For re-checks, provide a dedicated comparison:

```text
BEFORE                         AFTER

┌───────────────┐             ┌───────────────┐
│               │             │               │
│   Cabinet     │             │   Cabinet     │
│               │             │               │
│   ❌ PS12     │             │   ✓ PS12      │
│               │             │               │
└───────────────┘             └───────────────┘
```

Users should be able to toggle:

```text
Before
After
Side-by-side
Overlay
```

---

# 30. Reports Screen

```text
REPORTS

Inspection:
INS-004

Overall:
PASS

Available Reports

[ Download Excel ]
[ Download PDF ]
[ Download Annotated Photos ]
```

Report package may contain:

```text
report.xlsx
report.pdf
annotated_photo.jpg
evidence/
```

---

# 31. Settings Screen

MVP settings:

```text
SETTINGS

Inspection

Detection Threshold
[ 0.70 ]

OCR Threshold
[ 0.60 ]

Position Tolerance
[ 0.08 ]

────────────────────────────

QC Checks

✓ Component Presence
✓ Label Check
✓ Position / Order
✓ Ferrule Check
□ Wire Color
□ Terminal Mapping

────────────────────────────

Models

Detector:
cabinet_detector_v1

OCR:
Tesseract

────────────────────────────

[ SAVE SETTINGS ]
```

Thresholds should ideally be configuration values rather than hard-coded in frontend code.

---

# 32. Component States

Every UI component should have clear states.

## Upload

```text
EMPTY
UPLOADING
READY
ERROR
```

## Inspection

```text
QUEUED
PROCESSING
COMPLETED
FAILED
```

## QC Check

```text
PASS
FAIL
REVIEW
```

## Issue

```text
OPEN
RECHECKED
CLOSED
```

---

# 33. Error Handling

Errors must be understandable to non-developers.

### Bad

```text
KeyError: 'component_id'
```

### Good

```text
Unable to read the component column from the Excel file.

Please verify that the spreadsheet contains a component/tag column.

[ View Expected Format ]
```

---

# 34. Empty States

Example:

```text
NO INSPECTIONS YET

Start your first cabinet inspection.

[ + NEW INSPECTION ]
```

For reports:

```text
NO REPORTS

Reports will appear after an inspection is completed.
```

---

# 35. Loading States

Use meaningful loading messages:

```text
Reading engineering drawing...
```

```text
Building expected cabinet model...
```

```text
Detecting cabinet components...
```

```text
Reading labels and ferrules...
```

```text
Running QC checks...
```

```text
Generating evidence...
```

---

# 36. Responsive Design

Minimum supported layout:

```text
Desktop
1280 × 720
```

Recommended:

```text
1366 × 768
1920 × 1080
```

The primary use case is a desktop/laptop QC workstation.

Mobile should be considered secondary.

---

# 37. Accessibility

The frontend should:

- Use readable contrast.
- Never communicate status using color alone.
- Provide text labels for PASS/FAIL/REVIEW.
- Use meaningful button labels.
- Provide accessible error messages.
- Avoid excessively small technical text.
- Keep keyboard navigation possible where the framework supports it.

Example:

Do not show only:

```text
🔴
```

Instead:

```text
FAIL
```

with the color as secondary reinforcement.

---

# 38. Component Library

Recommended reusable frontend components:

```text
AppShell
Sidebar
PageHeader

FileUploadCard
FileStatus
ValidationCard

StatusBadge
StatusSummary
ResultCard

InspectionImageViewer
BoundingBoxOverlay
EvidenceViewer
IssueCard

ExpectedFoundComparison
QCChecklist
CheckRow

ProgressIndicator
EmptyState
ErrorState

RecheckComparison
HistoryTimeline

DownloadButton
ExportPanel
```

---

# 39. Frontend State Model

Suggested application state:

```javascript
{
  project: {},
  inputs: {
    cabinetPhoto: null,
    gaDrawing: null,
    excelFile: null,
    checklist: null
  },

  validation: {
    status: "pending",
    issues: []
  },

  expectedModel: {},

  inspection: {
    id: null,
    status: "idle",
    progress: null
  },

  results: {
    overall: null,
    pass: 0,
    fail: 0,
    review: 0,
    checks: []
  },

  selectedIssue: null,

  recheck: {
    previousInspectionId: null,
    currentInspectionId: null,
    changes: []
  }
}
```

---

# 40. API Response Design

The frontend should receive structured data.

Example:

```json
{
  "inspection_id": "INS-001",
  "overall_result": "FAIL",

  "summary": {
    "pass": 18,
    "fail": 4,
    "review": 2
  },

  "checks": [
    {
      "id": "CHK-001",
      "name": "Power Supply PS12",
      "expected": "Installed",
      "found": "Missing",
      "result": "FAIL",
      "confidence": 0.96,
      "evidence": "/evidence/fail_001_ps12.jpg"
    }
  ]
}
```

This keeps frontend rendering independent from the AI implementation.

---

# 41. Image Viewer Requirements

The image viewer is a critical component.

It should support:

```text
Zoom +
Zoom -
Fit to screen
Reset
Pan
```

Annotations:

```text
Bounding boxes
Issue numbers
Component IDs
PASS/FAIL markers
```

Example:

```text
       ┌──────────────┐
       │ PS12         │
       │              │
       └──────────────┘
             ①

① PS12 — Missing
```

Clicking marker `①` should open the corresponding issue.

---

# 42. Evidence Navigation

The user should be able to navigate:

```text
Issue list
    ↓
Issue
    ↓
Photo marker
    ↓
Zoomed evidence
    ↓
Expected vs Found
```

This should be one of the smoothest interactions in the application.

---

# 43. Demo Mode

For the hackathon presentation, the application should support a clean live demonstration.

Recommended flow:

```text
1. Upload sample inputs
        ↓
2. Run inspection
        ↓
3. Show FAIL summary
        ↓
4. Click PS12
        ↓
5. Show evidence
        ↓
6. Click CB43/44
        ↓
7. Show order mismatch
        ↓
8. Upload fixed photo
        ↓
9. Re-check
        ↓
10. Show issues closed
```

The demo should use the same real pipeline as the normal application rather than a fake presentation mode.

---

# 44. Frontend Performance

The frontend should:

- Avoid repeatedly uploading the same files.
- Display thumbnails where possible.
- Load full-resolution images only when required.
- Use lazy loading for inspection history.
- Keep large annotated images separate from list views.
- Avoid blocking the UI during long AI inference.
- Show processing status while backend inference is running.

For the MVP, a synchronous inspection request is acceptable if processing time is short enough. A background job architecture should be introduced if inference becomes long-running.

---

# 45. Security

The frontend must treat cabinet data as confidential.

Requirements:

- Do not expose uploaded files through public URLs.
- Do not log image contents in browser console.
- Do not place sensitive engineering data in query parameters.
- Use authenticated API access for production.
- Use HTTPS in production.
- Restrict report/evidence access by project/user.
- Keep original images immutable.

---

# 46. Frontend Folder Structure

For the current Streamlit MVP:

```text
frontend/
├── app.py
├── pages/
│   ├── dashboard.py
│   ├── new_inspection.py
│   ├── inspection.py
│   ├── history.py
│   └── reports.py
│
├── components/
│   ├── upload_card.py
│   ├── status_card.py
│   ├── inspection_viewer.py
│   ├── issue_card.py
│   ├── checklist.py
│   ├── evidence_viewer.py
│   └── recheck.py
│
├── services/
│   ├── api.py
│   └── inspection_service.py
│
├── state/
│   └── session_state.py
│
└── styles/
    └── theme.css
```

For future React:

```text
frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── store/
│   └── styles/
│
└── package.json
```

---

# 47. Frontend-to-Backend Flow

```text
USER
 │
 │ Upload files
 ▼
FRONTEND
 │
 │ POST /inspections
 ▼
FASTAPI
 │
 ├── GA Parser
 ├── Excel Parser
 ├── Vision Engine
 ├── OCR
 ├── Matching
 └── QC Rules
 │
 ▼
RESULT JSON
 │
 ▼
FRONTEND
 │
 ├── Status Summary
 ├── Annotated Photo
 ├── Issues
 ├── Checklist
 └── Evidence
```

---

# 48. Frontend Acceptance Criteria

The frontend is complete when:

### Upload

- User can upload cabinet photo.
- User can upload GA PDF.
- User can upload Excel file.
- User can select a QC checklist.
- Invalid inputs produce understandable errors.

### Inspection

- User can start inspection.
- Processing state is visible.
- Results appear without requiring page refresh where possible.

### Results

- PASS / FAIL / REVIEW counts are visible.
- Overall status is visible.
- Every check has a result.
- Expected vs Found values are visible.
- FAIL checks have evidence.
- Evidence can be opened from the issue.

### Re-check

- User can upload a new photo.
- Previous failed issues are shown.
- Re-check runs against the same expected model.
- Resolved issues become CLOSED.
- Unresolved issues remain OPEN.
- Before/after results are visible.

### Reporting

- QC checklist can be exported.
- Annotated evidence can be accessed.
- Inspection history is preserved.

---

# 49. UX Definition of Done

The frontend should satisfy these user-level statements:

```text
"I know what files I need to upload."

"I know whether the system understood my inputs."

"I can see whether the cabinet passed."

"I can immediately see what failed."

"I can click a failure and see where it happened."

"I can understand what was expected versus what was found."

"I can upload a corrected photo."

"I can see which problems were fixed."

"I can prove the result with a report."
```

---

# 50. Final Frontend Architecture

```text
                         EAGLE EYE UI
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
       PROJECT SETUP                     INSPECTION
             │                                 │
             ▼                                 ▼
      File Uploads                       Results Dashboard
             │                                 │
             ▼                    ┌────────────┼────────────┐
      Input Validation             ▼            ▼            ▼
             │                   PASS         FAIL        REVIEW
             ▼                    │            │            │
      Expected Model              │            ▼            │
             │                    │      Evidence Viewer    │
             └────────────────────┼────────────┼────────────┘
                                  │            │
                                  ▼            ▼
                            QC Checklist   Issue Details
                                  │            │
                                  └─────┬──────┘
                                        ▼
                                  Re-check Flow
                                        │
                                        ▼
                                Before / After
                                        │
                                        ▼
                                  Issue History
                                        │
                                        ▼
                                    Reports
```

---

# 51. Recommended MVP Screen Order

For the actual build, implement screens in this order:

```text
1. New Inspection
       ↓
2. Input Validation
       ↓
3. Inspection Processing
       ↓
4. Inspection Results
       ↓
5. Annotated Image Viewer
       ↓
6. Issue Detail
       ↓
7. QC Checklist
       ↓
8. Re-check
       ↓
9. History
       ↓
10. Reports
       ↓
11. Dashboard
       ↓
12. Settings
```

The first seven screens are enough to demonstrate the complete core EAGLE EYE workflow.

---

# 52. Final UX Principle

EAGLE EYE should feel like a **QC workstation**, not an AI chatbot.

The primary interaction should always be:

```text
WHAT SHOULD BE THERE?
        ↓
WHAT DID THE CAMERA SEE?
        ↓
DO THEY MATCH?
        ↓
IF NOT, WHERE IS THE PROBLEM?
        ↓
HAS THE PROBLEM BEEN FIXED?
```

That interaction model should remain consistent across the entire frontend.
