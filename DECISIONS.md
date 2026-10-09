# EAGLE EYE — Architectural Decisions Log (ADR)

This document records key architectural and technical decisions made during the development of EAGLE EYE.

---

## Decision 1: Separation of AI Inference, Reference Parsing, and Business Rules

- **Status:** Approved  
- **Context:** To ensure the system generalizes to unseen cabinet photographs and fresh engineering references without hardcoding test cases.  
- **Decision:**  
  1. **CV/AI Engine:** Performs detection and OCR ("What is visually present?").  
  2. **Parsers:** Convert GA drawings and Excel wire lists into a machine-readable **Expected Cabinet Model** ("What should be present and where?").  
  3. **Matching Engine:** Computes spatial and tag mappings between observed and expected models.  
  4. **QC Rule Engine:** Evaluates discrepancies according to configurable thresholds ("Is it correct?").  
  5. **Evidence Engine:** Generates bounding boxes, zoomed crops, and rationale ("Can we prove the result?").  

---

## Decision 2: Python-First Backend Architecture (FastAPI + Pydantic v2 + Uvicorn)

- **Status:** Approved (Phase 1 Implemented)  
- **Context:** High-performance REST APIs, typed request/response contracts, and OpenAPI documentation are required.  
- **Decision:** FastAPI selected for route management, `pydantic-settings` for typed environment configurations, and `uvicorn` as ASGI server. Route handlers strictly delegate to service modules.

---

## Decision 3: Modular Storage and Database Abstraction

- **Status:** Approved (Phase 1 Implemented)  
- **Context:** Local development needs lightweight execution, while production requires scalable database and object storage.  
- **Decision:**  
  - Database: SQLAlchemy ORM with SQLite (`sqlite:///./eagle_eye.db`) for local execution, thread-safe session generator (`get_db()`), compatible with PostgreSQL.  
  - File Storage: Local storage abstraction (`./storage`) ready for S3 / cloud object storage.  

---

## Decision 4: Deterministic Confidence Policy (PASS / FAIL / REVIEW)

- **Status:** Approved  
- **Context:** Avoid false positives and unproven fails.  
- **Decision:**  
  - **PASS:** High confidence detection matching expected engineering model.  
  - **FAIL:** High confidence detection contradicting expected model (requires visual crop & explanation).  
  - **REVIEW:** Low confidence, occluded, or ambiguous visual evidence.  

---

## Decision 5: Separate Backend API Package Structure

- **Status:** Approved (Phase 1 Implemented)  
- **Context:** Maintain clean separation between backend Python service and React Vite frontend.  
- **Decision:** All backend code resides inside `backend/app/`, runnable via `uvicorn backend.app.main:app --reload`. Frontend code remains isolated inside `src/`.

---

## Decision 6: Computer Vision & OCR Layer Decoupling

- **Status:** Approved (Phase 3 Implemented)  
- **Context:** CV object detection and OCR text extraction must be replaceable and testable without hard dependencies on specific model files or binaries.  
- **Decision:** Abstract base classes `BaseComponentDetector` and `BaseOCREngine` defined. Adapter implementations created for Ultralytics YOLOv8 and Tesseract OCR with graceful fallback logic.

---

## Decision 7: Multi-Signal Matching Engine Architecture

- **Status:** Approved (Phase 4 Implemented)  
- **Context:** Associating expected components with visual observations cannot rely solely on OCR or raw pixel coordinates.  
- **Decision:** `MatchingEngine` computes multi-signal confidence scores combining exact normalized tags, raw OCR tags, component type classifications, relative spatial order proximity, and detector confidence. Ambiguous or low-confidence matches return `MatchStatus.AMBIGUOUS` or `UNMATCHED`.

---

## Decision 8: Modular QC Decision Engine & Status Aggregation Policy

- **Status:** Approved (Phase 4 Implemented)  
- **Context:** Engineering Quality Control checks must be modular, explainable, and independent of specific image file formats.  
- **Decision:** Modular rule architecture (`BaseQCRule`) with specific implementations: `ComponentPresenceRule`, `ExtraComponentRule`, `ComponentTypeRule`, `ComponentOrderRule`, `LabelRule`, `FerruleRule`. Aggregation policy strictly enforced: any mandatory check failure sets overall status to `FAIL`; otherwise, any check under review sets overall status to `REVIEW`; otherwise `PASS`.

---

## Decision 9: Visual Evidence & Proof Generation Architecture

- **Status:** Approved (Phase 5 Implemented)  
- **Context:** Auditable evidence is required for every `FAIL` or `REVIEW` issue. Non-spatial issues (missing components) must not have fabricated bounding boxes.  
- **Decision:** `EvidenceService` generates master annotated images (`storage/evidence/annotated/`), 25% padded defect crops (`storage/evidence/crops/`), and synthetic dark technical evidence cards (`storage/evidence/cards/`). File serving endpoints enforce strict path traversal defenses using `Path.relative_to()`.

---

## Decision 10: Immutable Inspection History & Deterministic Issue Fingerprinting

- **Status:** Approved (Phase 6 Implemented)  
- **Context:** Operators fixing cabinet defects require re-check comparisons against previous inspections without mutating historical inspection records.  
- **Decision:** `RecheckService` persists inspections to SQLite via SQLAlchemy (`inspections`, `inspection_issues`, `recheck_comparisons`). Issue fingerprints are deterministically calculated from `rule_id` + normalized component tag / category (`compute_issue_fingerprint`), allowing exact before/after issue lifecycle mapping (`OPEN`, `RESOLVED`, `STILL_OPEN`, `NEW`). Previous inspections remain 100% immutable.

---

## Decision 11: AI Readiness Audit & Non-Fabrication Fallback Policy

- **Status:** Approved (Phase 8 Implemented)  
- **Context:** Real-world validation requires evaluating AI model readiness without claiming fake model accuracy or hallucinating detection output when model weights or native OS binaries are absent.  
- **Decision:** `YOLOComponentDetector` and `TesseractOCREngine` explicitly query host environment capabilities (`has_weights` and `is_available`). When custom weights (`cabinet_yolov8.pt`) or `tesseract` binary are missing, the system gracefully delegates to OpenCV contour analysis or deterministic test fixtures without throwing uncaught exceptions or hallucinating false high-confidence detections. Full validation results logged in `DOCUMENTS/PHASE_8_VALIDATION_REPORT.md`.

