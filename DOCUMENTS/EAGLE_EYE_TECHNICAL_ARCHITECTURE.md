# EAGLE EYE — Technical Architecture

## 1. Overview

EAGLE EYE is an AI-assisted quality-control system for electrical control cabinets.

The core architectural principle is:

> **Convert engineering documents into an Expected Cabinet Model, convert the cabinet photograph into an Observed Cabinet Model, and compare the two using AI, computer vision, OCR, geometry, and deterministic engineering rules.**

The hackathon specification requires the system to upload cabinet photos, GA drawings, wire/label lists and a QC checklist; inspect the cabinet; compare expected versus observed conditions; generate evidence-backed PASS/FAIL results; and support re-check after corrections.

---

## 2. High-Level Architecture

```text
                    ┌──────────────────────────────┐
                    │          USER / QC            │
                    │       Web Dashboard           │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────────┐
              │              API / ORCHESTRATOR         │
              │         Python + FastAPI                │
              └────────────────┬───────────────────────┘
                               │
             ┌─────────────────┼──────────────────┐
             │                 │                  │
             ▼                 ▼                  ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │ GA Parser   │   │ Excel Parser│   │ Image Input │
      │ PDF + OCR   │   │ Pandas      │   │ JPG / PNG   │
      └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
             │                 │                  │
             └─────────────────┼──────────────────┘
                               ▼
                  ┌─────────────────────────┐
                  │ EXPECTED CABINET MODEL │
                  │                         │
                  │ Components              │
                  │ Positions               │
                  │ Labels                  │
                  │ Order                   │
                  │ Ferrules                │
                  │ Wiring                  │
                  └────────────┬────────────┘
                               │
                               │ Expected
                               ▼
                  ┌─────────────────────────┐
                  │   COMPUTER VISION       │
                  │       PIPELINE          │
                  │                         │
                  │ Preprocessing            │
                  │ Perspective Correction  │
                  │ Object Detection         │
                  │ OCR                     │
                  │ Ferrule Detection        │
                  │ Wire/Color Detection     │
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │ OBSERVED CABINET MODEL  │
                  │                         │
                  │ Components              │
                  │ Bounding Boxes          │
                  │ Labels                  │
                  │ Positions               │
                  │ Ferrules                │
                  │ Confidence              │
                  └────────────┬────────────┘
                               │
                Expected       │       Observed
                     ──────────┼──────────
                               ▼
                  ┌─────────────────────────┐
                  │    MATCHING ENGINE      │
                  │                         │
                  │ ID Matching              │
                  │ Spatial Matching         │
                  │ Component Matching      │
                  │ OCR Matching             │
                  └────────────┬────────────┘
                               ▼
                  ┌─────────────────────────┐
                  │       QC RULE ENGINE    │
                  │                         │
                  │ Presence                │
                  │ Position / Order        │
                  │ Label                   │
                  │ Ferrule                 │
                  │ Wire / Terminal         │
                  │ Custom Rules             │
                  └────────────┬────────────┘
                               ▼
                  ┌─────────────────────────┐
                  │ DECISION ENGINE         │
                  │                         │
                  │ PASS                    │
                  │ FAIL                    │
                  │ REVIEW                  │
                  └────────────┬────────────┘
                               ▼
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
      ┌────────────┐    ┌──────────────┐   ┌─────────────┐
      │ Annotated  │    │ QC Report    │   │ Inspection  │
      │ Photo      │    │ Excel/PDF    │   │ History     │
      └────────────┘    └──────────────┘   └──────┬──────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ RE-CHECK PHOTO  │
                                          │                 │
                                          │ Compare against│
                                          │ previous issues│
                                          └─────────────────┘
```

---

# 3. Architecture Layers

## 3.1 Presentation Layer

### MVP

Use:

```text
Streamlit
```

The dashboard should provide:

- Cabinet photo upload
- GA PDF upload
- Excel upload
- QC checklist selection
- Inspection trigger
- PASS / FAIL / REVIEW summary
- Annotated cabinet image
- Issue list
- Expected vs Found comparison
- Evidence snippets
- Report download
- Re-check workflow
- Inspection history

### Future Production UI

```text
React / Next.js
        +
FastAPI
```

The hackathon MVP should avoid unnecessary frontend complexity.

---

# 4. Backend / API Layer

Recommended:

```text
Python
FastAPI
```

The backend orchestrates the entire inspection pipeline.

Suggested API structure:

```text
POST /projects
POST /inspections

POST /parse/ga
POST /parse/excel

POST /inspect
POST /recheck

GET /inspection/{id}
GET /inspection/{id}/results
GET /inspection/{id}/evidence
GET /inspection/{id}/report
GET /inspection/{id}/history
```

---

# 5. Document Intelligence Layer

The system should not directly compare raw PDF/Excel content with the image.

Instead:

```text
GA PDF + Excel
       ↓
Engineering Information Extraction
       ↓
Normalization
       ↓
Expected Cabinet Model
```

This creates a stable internal representation regardless of the original document formatting.

---

# 6. GA Drawing Parser

## Input

```text
GA_Drawing.pdf
```

## Pipeline

```text
PDF
 │
 ▼
PyMuPDF
 │
 ├── Embedded text
 │
 └── Rendered page
          ↓
        OCR
          ↓
   Engineering Tags
          ↓
   Position Extraction
          ↓
Expected Components
```

Example extracted tags:

```text
PS11
PS12
D12
CB41
CB42
CB43
CB44
1CBP01
1CBP02
1CBP03
1CBP04
X3
PE
```

Normalized representation:

```json
{
  "id": "PS12",
  "type": "power_supply",
  "expected_position": {
    "x": 0.32,
    "y": 0.21
  },
  "source": "GA"
}
```

The parser should preserve:

- Component ID
- Component type
- Expected position
- Page number
- Source
- Extraction confidence

---

# 7. Excel Parser

## Input

```text
wire_list.xlsx
```

The parser should support variations in column names.

For example:

```text
Device
Device Label
Component
Tag
Reference
```

can map to:

```text
component_id
```

Similarly:

```text
Wire
Wire ID
Cable
Wire Number
```

can map to:

```text
wire_id
```

Pipeline:

```text
Excel
 ↓
Schema Detection
 ↓
Column Mapping
 ↓
Normalization
 ↓
Wire/Ferrule Model
```

Example:

```json
{
  "wire_id": "CB11-2/PS11-L",
  "source": "CB11",
  "source_terminal": "2",
  "destination": "PS11",
  "destination_terminal": "L",
  "expected_ferrule": "CB11-2/PS11-L"
}
```

---

# 8. Expected Cabinet Model

The Expected Cabinet Model is the central engineering abstraction.

Instead of:

```text
PDF vs Photo
```

the system performs:

```text
EXPECTED MODEL vs OBSERVED MODEL
```

Example:

```json
{
  "cabinet_id": "CAB-001",

  "components": [
    {
      "id": "PS11",
      "type": "power_supply",
      "label": "PS11",
      "position": [0.12, 0.25]
    },
    {
      "id": "PS12",
      "type": "power_supply",
      "label": "PS12",
      "position": [0.25, 0.25]
    },
    {
      "id": "CB41",
      "type": "breaker",
      "order": 1,
      "position": [0.40, 0.30]
    }
  ],

  "ferrules": [
    {
      "wire_id": "CB11-2/PS11-L",
      "expected_text": "CB11-2/PS11-L"
    }
  ]
}
```

The model should contain:

- Component IDs
- Component types
- Labels
- Expected positions
- Expected order
- Ferrule expectations
- Wire relationships
- Terminal relationships
- Wire color expectations where available
- Source provenance
- Confidence
- Validation status

---

# 9. Computer Vision Pipeline

The cabinet photo is converted into the Observed Cabinet Model.

```text
Cabinet Photo
      ↓
Image Quality Check
      ↓
Perspective Correction
      ↓
Cabinet ROI Detection
      ↓
Component Detection
      ↓
Label Detection
      ↓
OCR
      ↓
Ferrule Detection/OCR
      ↓
Wire Detection
      ↓
Spatial Mapping
      ↓
Observed Cabinet Model
```

---

# 10. Component Detection

For the real AI model, use a YOLO-family object detector or another suitable object detection model.

Potential classes:

```text
power_supply
breaker
terminal_block
baseplate
controller
earth_bar
label
ferrule
wire
```

Example output:

```json
{
  "class": "breaker",
  "bbox": [420, 180, 470, 350],
  "confidence": 0.94
}
```

Important design decision:

> Do not train the model only to recognize `CB43`.

Train it to recognize the physical component category:

```text
breaker
power_supply
terminal
baseplate
...
```

Then use OCR to determine its engineering identifier:

```text
breaker
   +
OCR = CB43
```

This helps prevent hard-coded sample recognition.

---

# 11. OCR Pipeline

For every detected component:

```text
Component Bounding Box
          ↓
      Crop Region
          ↓
 Image Enhancement
          ↓
     OCR Engine
          ↓
 Text + Confidence
```

Example:

```text
Detected object:
    breaker

OCR:
    CB43

Confidence:
    0.96
```

The result becomes:

```text
breaker + CB43
```

inside the Observed Cabinet Model.

OCR should also be used for:

- Device labels
- Baseplate labels
- Ferrule text
- Terminal labels
- Other engineering identifiers

---

# 12. Perspective Correction

Cabinet photographs may be taken at different angles.

Example:

```text
Original photograph

        /─────────/
       /         /
      / cabinet /
     /─────────/
```

The GA/normalized representation may be:

```text
┌──────────────────┐
│                  │
│     CABINET      │
│                  │
└──────────────────┘
```

Therefore:

```text
Original Image
      ↓
Cabinet Boundary / Reference Points
      ↓
Homography
      ↓
Normalized Cabinet Image
```

Normalized coordinates allow meaningful spatial comparison.

Example:

```text
Expected:
CB43 = (0.65, 0.32)

Found:
CB43 = (0.66, 0.34)

→ PASS
```

Whereas:

```text
Expected:
CB43 = (0.65, 0.32)

Found:
CB43 = (0.78, 0.32)

→ REVIEW / FAIL
```

depending on configured tolerance and evidence confidence.

---

# 13. Matching Engine

Matching should not rely on OCR alone.

Use multiple signals:

```text
Expected Component
        │
        ├── ID similarity
        ├── Type similarity
        ├── Spatial similarity
        ├── Order relationship
        └── Visual/detection confidence
                ↓
           Match Score
                ↓
       ┌────────┴────────┐
       ▼                 ▼
     MATCH             REVIEW
```

Example:

```text
Expected:

ID       = CB43
Type     = breaker
Position = 0.70

Observed:

ID       = CB43
Type     = breaker
Position = 0.71

→ MATCH
```

---

# 14. QC Rule Engine

The AI should answer:

> "What do I see?"

The rule engine should answer:

> "Is what I see correct?"

This separation is critical.

---

## 14.1 Presence Check

```text
Expected:
PS12

Observed:
Nothing

→ FAIL
```

---

## 14.2 Position / Order Check

Expected:

```text
CB41
CB42
CB43
CB44
```

Observed:

```text
CB41
CB42
CB44
CB43
```

All components exist, but their order differs.

```text
→ FAIL
```

---

## 14.3 Label Check

Expected:

```text
1CBP03
```

Observed:

```text
No label
```

```text
→ FAIL
```

---

## 14.4 Ferrule Check

Expected:

```text
X3 → Ferrule fitted
```

Observed:

```text
No ferrule detected
```

```text
→ FAIL
```

---

## 14.5 Wiring Check

Stretch capability:

```text
Expected:

Brown       → Phase
Blue        → Neutral
Green/Yellow→ Earth
```

Observed:

```text
Wire color
+
Terminal
+
Destination
```

Then compare the observed relationship against the expected wiring model.

---

# 15. Confidence Engine

AI predictions should not automatically become hard decisions.

Example:

```text
Detection confidence = 0.96
OCR confidence       = 0.93
Position confidence  = 0.91

Overall confidence   = 0.94
```

This can support an automatic decision.

But:

```text
Detection = 0.61
OCR       = 0.42
Position  = 0.58
```

should become:

```text
REVIEW
```

rather than an unsupported FAIL.

A practical confidence score can combine:

```text
Overall Score =
    w1 × detector confidence
  + w2 × OCR confidence
  + w3 × spatial consistency
  + w4 × matching confidence
```

The weights and thresholds should be calibrated against validation data rather than arbitrarily fixed.

---

# 16. Decision Engine

```text
                     QC RESULT
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
            PASS        FAIL      REVIEW
              │          │          │
           Correct     Definite   Uncertain
           evidence    problem    evidence
                         │
                         ▼
                  Visual Evidence
```

Recommended logic:

```python
if any(mandatory_check == "FAIL"):
    overall = "FAIL"

elif any(mandatory_check == "REVIEW"):
    overall = "REVIEW"

else:
    overall = "PASS"
```

---

# 17. Evidence Engine

Every FAIL should have evidence.

Example:

```text
FAIL #002

Check:
Breaker Order

Expected:
CB41 → CB42 → CB43 → CB44

Found:
CB41 → CB42 → CB44 → CB43
```

The image should be annotated:

```text
┌─────────────────────────────┐
│                             │
│     CB41 CB42 CB44 CB43     │
│             ┌──────┐        │
│             │ FAIL │        │
│             └──────┘        │
│                             │
└─────────────────────────────┘
```

Evidence directory:

```text
evidence/
└── inspection_001/
    ├── full_image.jpg
    ├── fail_001_ps12.jpg
    ├── fail_002_cb_order.jpg
    ├── fail_003_1cbp03.jpg
    └── fail_004_x3_ferrule.jpg
```

---

# 18. Report Generation

The report should contain:

```text
EAGLE EYE QC REPORT

Inspection ID: INS-001
Cabinet: CAB-001

Overall Result: FAIL

────────────────────────────────────

Check             Expected     Found       Result

PS12              Installed    Missing     FAIL
CB Order          41-42-43-44  41-42-44-43 FAIL
1CBP03 Label      1CBP03       Missing     FAIL
X3 Ferrule        Fitted       Missing     FAIL
PE                Present      Present     PASS
```

Each result should additionally contain:

- Confidence
- Expected value
- Found value
- Evidence image
- Timestamp
- Model version
- Rule/check ID

---

# 19. Re-check Architecture

The re-check flow is:

```text
             INITIAL INSPECTION
                     │
                     ▼
              FAIL / REVIEW
                     │
                     ▼
              Technician Fixes
                     │
                     ▼
               New Photo
                     │
                     ▼
              SAME EXPECTED MODEL
                     │
                     ▼
                RE-INSPECTION
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
       CLOSED      OPEN       NEW ISSUE
```

Example:

### Before

```text
PS12       → FAIL
CB43/44    → FAIL
1CBP03     → FAIL
X3         → FAIL
```

### After

```text
PS12       → PASS   CLOSED
CB43/44    → PASS   CLOSED
1CBP03     → PASS   CLOSED
X3         → FAIL   OPEN
```

The history should retain both inspections.

---

# 20. Database Architecture

### Hackathon MVP

```text
SQLite
```

### Future deployment

```text
PostgreSQL
```

Suggested entities:

```text
projects
    │
    ├── documents
    │
    ├── expected_components
    │
    ├── inspections
    │       │
    │       ├── observed_components
    │       ├── check_results
    │       ├── issues
    │       └── evidence
    │
    └── inspection_history
```

---

# 21. Core Data Model

## Project

```text
project_id
name
version
created_at
```

## ExpectedComponent

```text
id
type
label
expected_position
order
source
confidence
```

## ExpectedFerrule

```text
wire_id
expected_text
terminal
source
```

## Inspection

```text
inspection_id
project_id
image
timestamp
status
model_version
```

## ObservedComponent

```text
id
type
bbox
label
ocr_confidence
detector_confidence
position
```

## CheckResult

```text
check_id
expected
found
result
confidence
evidence_path
```

## Issue

```text
issue_id
check_id
status
first_seen
closed_at
```

## InspectionHistory

```text
inspection_id
previous_inspection_id
changes
```

---

# 22. Recommended Technology Stack

## Frontend

```text
Streamlit
```

for MVP.

Later:

```text
React / Next.js
```

## Backend

```text
Python
FastAPI
```

## Computer Vision

```text
OpenCV
PyTorch
YOLO-family detector
```

## OCR

Initial:

```text
Tesseract
```

The OCR layer should remain replaceable if the real dataset requires a stronger OCR model.

## Document Processing

```text
PyMuPDF
Pandas
OpenPyXL
```

## Database

```text
SQLite
```

→ PostgreSQL for production.

## Reporting

```text
Pandas
OpenPyXL
ReportLab
```

## Storage

MVP:

```text
Local filesystem
```

Production:

```text
Object Storage
+
PostgreSQL
```

---

# 23. Complete Processing Pipeline

```text
                     INPUTS
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
    GA PDF          Excel             PHOTO
       │               │                │
       ▼               ▼                ▼
   GA Parser      Excel Parser     Image Preprocess
       │               │                │
       └───────────────┼────────────────┘
                       ▼
             EXPECTED CABINET MODEL
                       │
                       │
                       ▼
              COMPUTER VISION
                       │
        ┌──────────────┼───────────────┐
        │              │               │
        ▼              ▼               ▼
     Detector         OCR          Geometry
        │              │               │
        └──────────────┼───────────────┘
                       ▼
              OBSERVED MODEL
                       │
                       ▼
                MATCHING ENGINE
                       │
                       ▼
                 QC RULE ENGINE
                       │
                       ▼
               DECISION ENGINE
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
           PASS      FAIL      REVIEW
                       │
                       ▼
                EVIDENCE ENGINE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Annotated      QC Report    History
       Photo        Excel/PDF
                       │
                       ▼
                    RE-CHECK
```

---

# 24. Key Architectural Principle

The most important design decision is:

```text
AI/CV
  ↓
"What is present?"

Structured Model
  ↓
"Where is it?"

Rule Engine
  ↓
"Is it correct?"

Evidence Engine
  ↓
"Can I prove it?"

Report Engine
  ↓
"What should the inspector do?"
```

This separation allows EAGLE EYE to evolve from the current executable OCR baseline into a real cabinet-specific AI inspection system without rewriting the entire application.

---

# 25. Recommended Build Order

```text
PHASE 1
PDF + Excel → Expected Model
        ↓
PHASE 2
Photo → OCR + Detected Tags
        ↓
PHASE 3
Expected vs Observed
        ↓
PHASE 4
PASS / FAIL / REVIEW
        ↓
PHASE 5
Annotated Evidence
        ↓
PHASE 6
Real Object Detection Model
        ↓
PHASE 7
Position / Perspective Verification
        ↓
PHASE 8
Ferrule + Wiring Inspection
        ↓
PHASE 9
Re-check + History
        ↓
PHASE 10
Fresh Cabinet Validation
```

The final objective is **not** simply a YOLO model.

The final system is:

```text
Documents
    +
Computer Vision
    +
OCR
    +
Geometry
    +
Engineering Rules
    +
Evidence
    +
Re-check History
    =
EAGLE EYE
```
