# EAGLE EYE — AI Vision for Cabinet Quality Control

**EAGLE EYE** is a hackathon-grade end-to-end AI-assisted electrical control cabinet quality inspection system. It compares physical cabinet photographs against engineering truth (GA PDF drawings & Excel Wire/Label lists) to identify defects, generate visual proof, and track re-check lifecycles over time.

---

## 1. System Architecture

```text
GA PDF + Wire Excel  ──>  [GAParser / ExcelParser]  ──> ExpectedCabinetModel ──┐
                                                                               ├─> [Matching Engine] ──> [QC Rule Engine] ──> InspectionResult ──> [Evidence Service] ──> [Recheck Engine] ──> SQLite DB
Cabinet Photo        ──>  [ImagePreprocessor / CV]  ──> ObservedCabinetModel ──┘                                                             │
                                                                                                                                             ▼
                                                                                                                                  Industrial React UI
```

---

## 2. Quick Start Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

### Step 1: Start Backend API Server
From project root:
```bash
uvicorn backend.app.main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Endpoint: [http://localhost:8000/health](http://localhost:8000/health)

### Step 2: Start Frontend Industrial Control Dashboard
From project root:
```bash
npm run dev
```
- Open browser at: [http://localhost:5173](http://localhost:5173)

---

## 3. Key Features

- **Engineering Ingestion:** Extracts tags, wire schedules, labels, and drawing bounding boxes from GA PDFs and Excel spreadsheets.
- **Vision Observation:** Detects physical components, assesses photo quality (brightness, blur), and performs OCR extraction without hardcoding fake AI detections.
- **Multi-Signal QC Engine:** Evaluates expected vs. observed models across 6 modular rules (`ComponentPresenceRule`, `ExtraComponentRule`, `ComponentTypeRule`, `ComponentOrderRule`, `LabelRule`, `FerruleRule`). Returns deterministic `PASS`, `FAIL`, or `REVIEW` verdicts.
- **Visual Evidence & Proof:** Generates master annotated cabinet images, 25% padded defect crops, and dark technical evidence cards for non-spatial missing components (`NOT OBSERVED`).
- **Re-check Lifecycle:** Tracks issue transitions (`OPEN`, `RESOLVED`, `STILL_OPEN`, `NEW`) using deterministic issue fingerprints while keeping historical inspections 100% immutable.
- **Industrial Dashboard UI:** High-density dark technical workstation interface featuring Quick Launch test scenarios, interactive cabinet viewer, defect issue cards, and audit registry.

---

## 4. How to Run Tests

### Backend Test Suite (38 Pytest Tests):
```bash
pytest backend/tests
```

### Frontend TypeScript Build Check:
```bash
npm run build
```
