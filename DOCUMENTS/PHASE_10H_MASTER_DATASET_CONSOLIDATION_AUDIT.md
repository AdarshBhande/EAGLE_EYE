# EAGLE EYE — PHASE 10H: MASTER DATASET CONSOLIDATION AUDIT & STAGING PLAN

## 1. Executive Summary
This document presents the master dataset consolidation audit and staging design for **EAGLE EYE**. 

Following the successful staging of **300 real 1080p terminal block photographs (4,227 `TERMINAL_BLOCK` bounding boxes)** in Phase 10G, this audit evaluates the integration of existing workspace datasets (`datasets/eagle_eye_training/`) and newly staged terminal block assets into a unified 11-class Master YOLO Dataset (`datasets/master_yolo/`).

No models were trained, no files were overwritten or deleted, and no production application code was altered.

---

## 2. Existing Electrical Devices Dataset Audit

An empirical audit of `datasets/eagle_eye_training/` (identical to `datasets/Electrical Devices.v6i.yolov8/`) yielded:

- **Split Breakdown:**
  - **Train:** 2,656 images (2,656 label files)
  - **Validation:** 122 images (122 label files)
  - **Test:** 92 images (92 label files)
  - **TOTAL:** **2,870 images** (2,870 label files)
- **Total Bounding Boxes:** **6,154 annotated objects**
- **Image Resolution:** 100% `640 x 640` pixels
- **Annotation Integrity:**
  - **Empty Labels (0 bytes / negative samples):** 179 files
  - **Malformed Labels:** 0
  - **Out-of-Range Coordinates:** 0
  - **Duplicate Filenames Across Splits:** 0

### Existing 10 Classes Box Counts
| Class ID | Class Name | Box Count | % of Boxes |
| :---: | :--- | :---: | :---: |
| **0** | `Active-Harmonic-Filters` | 271 | 4.40% |
| **1** | `Air-Circuit-Breakers` | 450 | 7.31% |
| **2** | `Bus-Bar` | 1,206 | 19.60% |
| **3** | `Capacitors` | 736 | 11.96% |
| **4** | `Contactors` | 1,015 | 16.49% |
| **5** | `Fuses` | 847 | 13.76% |
| **6** | `MCB` | 297 | 4.83% |
| **7** | `Panel-Fans` | 394 | 6.40% |
| **8** | `Phase-Reactor` | 474 | 7.70% |
| **9** | `Power-Cable` | 464 | 7.54% |

---

## 3. Terminal Block Dataset Audit (`datasets/staged/terminal_block/`)

Verification of staged real terminal block assets from Phase 10G:
- **Staged Images:** `300` real 1080p photographs (`datasets/staged/terminal_block/images/`)
- **Staged Labels:** `300` YOLO label files (`datasets/staged/terminal_block/labels/`)
- **Total `TERMINAL_BLOCK` Bounding Boxes:** **`4,227` boxes** (Class ID `4`)
- **Annotation Integrity:** 100% paired, 0 malformed, 0 out-of-range, 0 zero-area boxes.

---

## 4. Master Taxonomy Class Mapping Proposal

Mapping existing classes to the **11-class EAGLE EYE Master Taxonomy**:

| Source Class (Electrical Devices) | Target Master Class ID & Name | Mapping Type | Rationale |
| :--- | :--- | :---: | :--- |
| `MCB` (6) | `1: CIRCUIT_BREAKER` | **DIRECT** | Primary breaker type in control cabinets (`CB43`, `CB44`, `1CBP03`). |
| `Air-Circuit-Breakers` (1) | `1: CIRCUIT_BREAKER` | **DIRECT** | Heavy air circuit breakers mapped under unified breaker class. |
| `Contactors` (4) | `2: CONTACTOR` | **DIRECT** | Motor contactors and switching units. |
| `Fuses` (5) | `5: FUSE` | **DIRECT** | Fuse holders and cartridge fuses. |
| `Bus-Bar` (2) | `6: BUS_BAR` | **DIRECT** | Distribution bus bars. |
| `Power-Cable` (9) | `7: POWER_CABLE` | **DIRECT** | Main supply and control cabling. |
| `Capacitors` (3) | **EXCLUDE** | **EXCLUDE** | PFC capacitors are rare in standard control cabinets; excluding avoids class clutter. |
| `Panel-Fans` (7) | **EXCLUDE** | **EXCLUDE** | Cooling fans are non-critical for internal control circuit inspection. |
| `Phase-Reactor` (8) | **EXCLUDE** | **EXCLUDE** | Heavy inductive reactors rarely appear in standard control panels. |
| `Active-Harmonic-Filters` (0)| **EXCLUDE** | **EXCLUDE** | Specialized power quality units. |

---

## 5. Master Taxonomy Coverage Analysis

| Class ID | Master Class Name | Current Available Boxes | Data Sources | Gap Status & Required Action |
| :---: | :--- | :---: | :--- | :--- |
| `0` | `POWER_SUPPLY` | 0 | None in repo | **CRITICAL GAP:** Needs 50–100 custom real photos of 24V DIN-rail units (`PS12`). |
| `1` | `CIRCUIT_BREAKER` | 747 | Existing (`MCB` + `ACB`) | **COVERED (PARTIAL):** 747 breaker boxes available. Augment with `control-panel-azure`. |
| `2` | `CONTACTOR` | 1,015 | Existing (`Contactors`) | **COVERED:** 1,015 contactor boxes available. |
| `3` | `RELAY` | 0 | None in repo | **GAP:** To be filled by `control-panel-azure` dataset. |
| `4` | `TERMINAL_BLOCK` | 4,227 | `staged/terminal_block` | **COVERED:** 4,227 real 1080p boxes staged (`X3`). |
| `5` | `FUSE` | 847 | Existing (`Fuses`) | **COVERED:** 847 fuse boxes available. |
| `6` | `BUS_BAR` | 1,206 | Existing (`Bus-Bar`) | **COVERED:** 1,206 bus bar boxes available. |
| `7` | `POWER_CABLE` | 464 | Existing (`Power-Cable`) | **COVERED:** 464 cable boxes available. |
| `8` | `MAIN_SWITCH` | 0 | None in repo | **GAP:** To be filled by `control-panel-azure` dataset. |
| `9` | `LABEL` | 0 | None in repo | **CRITICAL GAP:** Custom component faceplate label photo acquisition (OCR ROI). |
| `10` | `FERRULE` | 0 | None in repo | **CRITICAL GAP:** Custom macro photo acquisition for wire sleeve ferrules (`X3-01`). |

> [!IMPORTANT]
> **Component Tag Identity Principle:**  
> Specific schematic component tags (`PS12`, `CB43`, `CB44`, `1CBP03`, `X3`) **are NOT separate YOLO classes**. They are resolved downstream via Tesseract OCR text extraction + Spatial Reasoning + Engineering BOM matching.

---

## 6. Data Imbalance & Compatibility Analysis

- **Class Imbalance:**
  - `TERMINAL_BLOCK`: 4,227 boxes (High density)
  - `BUS_BAR`: 1,206 boxes
  - `CONTACTOR`: 1,015 boxes
  - `FUSE`: 847 boxes
  - `CIRCUIT_BREAKER`: 747 boxes
  - `POWER_CABLE`: 464 boxes
  - *Mitigation:* Apply image focal loss and class-weighted loss during YOLOv8 training to balance high-density terminal blocks against breaker classes.
- **Domain Compatibility:**
  - Existing dataset: `640x640` cropped images.
  - Staged terminal block dataset: `1920x1080` real photographs.
  - Both datasets contain real physical electrical hardware in realistic lighting. Multi-scale YOLOv8 training (`imgsz=640`) seamlessly handles resolution mixing.

---

## 7. Recommended Master Dataset Structure (`datasets/master_yolo/`)

```text
datasets/master_yolo/
├── data.yaml
├── images/
│   ├── train/   # ~2,217 images
│   ├── val/     # ~167 images
│   └── test/    # ~122 images
└── labels/
    ├── train/   # ~2,217 label files (.txt)
    ├── val/     # ~167 label files (.txt)
    └── test/    # ~122 label files (.txt)
```

`data.yaml` Specification:
```yaml
path: C:\Users\bhand\EAGLE_EYE\datasets\master_yolo
train: images/train
val: images/val
test: images/test
nc: 11
names:
  0: POWER_SUPPLY
  1: CIRCUIT_BREAKER
  2: CONTACTOR
  3: RELAY
  4: TERMINAL_BLOCK
  5: FUSE
  6: BUS_BAR
  7: POWER_CABLE
  8: MAIN_SWITCH
  9: LABEL
  10: FERRULE
```

---

## 8. Split Strategy (Zero Data Leakage)

- **Split Ratio:** `75% Train` / `15% Val` / `10% Test`
- **Source-Aware Grouping:**
  - **Source 1 (`eagle_eye_training`):** Preserve original 2,656 train / 122 val / 92 test split assignments.
  - **Source 2 (`staged/terminal_block`):** Split 225 train (75%), 45 val (15%), 30 test (10%) by random sequence grouping.
- **Resulting Master Splits:**
  - **Train:** 2,881 images
  - **Val:** 167 images
  - **Test:** 122 images

---

## 9. Ferrule Micro-Object Gap & Architecture

- **Ferrule Challenge:** Wire ferrules (`X3-01`) are tiny 5mm–15mm connectors. On a full 4K cabinet photo, a ferrule shrinks to < 3x4 pixels at standard 640x640 YOLO input size, leading to feature map loss.
- **Architectural Solution: Two-Tier Hierarchical Detection System**
  - **Tier 1 Macro Detector:** Detects `TERMINAL_BLOCK` bounds on full cabinet photos.
  - **Tier 2 Micro Crop Detector:** Crops `TERMINAL_BLOCK` ROI at native resolution and runs a dedicated 640x640 micro-detector trained on macro close-up ferrule photos.
- **Ferrule Acquisition Requirement:** 50–100 macro close-up photos of wired terminal blocks focused on wire entry ports.

---

## 10. Baseline Comparison Evaluation Plan

- **Baseline Model:** `models/weights/cabinet_yolov8.pt` (Trained on 10-class Electrical Devices dataset).
- **Future Master Model:** `models/weights/cabinet_master_yolov8.pt` (Trained on Consolidated Master Dataset).
- **Evaluation Metrics:** Precision (P), Recall (R), mAP@0.50, mAP@0.50:0.95, per-class AP, False Positives (FP), False Negatives (FN).
- **Primary Success Target:**
  - Baseline `TERMINAL_BLOCK` recall: `0.0%` (Model had no terminal block weights).
  - Master Model `TERMINAL_BLOCK` target: **`> 85.0% mAP50`**.

---

## 11. Final Master Dataset Decision & Next Steps
- **Decision:** **PROCEED TO MERGE AND CONSOLIDATE MASTER DATASET IN PHASE 10I**.
- **Consolidation Scope:** Merge `datasets/staged/terminal_block/` (Class ID 4) and converted core classes from `datasets/eagle_eye_training/` into `datasets/master_yolo/`.
- **Recommended Next Phase:** **Phase 10I (Master Dataset Consolidation Execution)**.
