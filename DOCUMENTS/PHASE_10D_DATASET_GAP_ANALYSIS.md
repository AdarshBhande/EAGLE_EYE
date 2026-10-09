# EAGLE EYE — PHASE 10D: DATASET GAP ANALYSIS & MASTER CLASS TAXONOMY

## 1. Executive Summary
This report presents a thorough audit of the computer vision dataset, YOLOv8 object detection taxonomy, and vision pipeline requirements for the **EAGLE EYE** industrial control cabinet quality control system.

Following the successful verification and integration of the initial 10-class YOLOv8n model (`models/weights/cabinet_yolov8.pt` in Phase 10C), this gap analysis evaluates what visual classes and dataset additions are required for EAGLE EYE to reliably detect all planted panel faults (**PS12 missing**, **CB43/CB44 swapped**, **1CBP03 label missing**, **X3 ferrule missing**) and generalize to unseen electrical control cabinets.

---

## 2. Current Model Coverage
The currently deployed model (`models/weights/cabinet_yolov8.pt`) was trained on the *Electrical Devices v6i* dataset.

### Current 10 Model Classes & Empirical Distribution
| Class ID | Class Name | Total Annotations | Dataset % | Primary Component Focus |
| :---: | :--- | :---: | :---: | :--- |
| **0** | `Active-Harmonic-Filters` | 271 | 4.40% | Power quality filter units |
| **1** | `Air-Circuit-Breakers` | 450 | 7.31% | Heavy power ACB units |
| **2** | `Bus-Bar` | 1,206 | 19.60% | Copper/aluminum distribution bars |
| **3** | `Capacitors` | 736 | 11.96% | Power factor correction capacitors |
| **4** | `Contactors` | 1,015 | 16.49% | Motor contactors & switching units |
| **5** | `Fuses` | 847 | 13.76% | Cartridge fuses & fuse holders |
| **6** | `MCB` | 297 | 4.83% | Miniature circuit breakers |
| **7** | `Panel-Fans` | 394 | 6.40% | Enclosure cooling fans |
| **8** | `Phase-Reactor` | 474 | 7.70% | Inductive phase reactors |
| **9** | `Power-Cable` | 464 | 7.54% | Heavy power cables |

### Usefulness Audit for EAGLE EYE Cabinet QC
- **Highly Useful for General QC:** `MCB`, `Contactors`, `Fuses`, `Bus-Bar`, `Power-Cable`.
- **Specialized / Low Relevance to Control Cabinets:** `Active-Harmonic-Filters`, `Phase-Reactor`, `Panel-Fans` (present in heavy power panels, but rare in standard automation control cabinets).
- **Direct Support for Planted Faults:**
  - `MCB` detects breaker physical boundaries (helps localize breakers like `CB43`, `CB44`, `1CBP03`).
  - **Zero classes** in the current model directly detect Power Supplies (`PS12`), Terminal Blocks (`X3`), Component Labels (`1CBP03`), or Wire Ferrules (`X3-01`).

---

## 3. Current Dataset Coverage
An inspection of `datasets/Electrical Devices.v6i.yolov8` (2,870 images, 6,154 annotated bounding boxes) and `datasets/eagle_eye_training` reveals:

- **Strong Representation:** Bus bars (19.6%), Contactors (16.5%), Fuses (13.8%), Capacitors (12.0%).
- **Moderate Representation:** Air Circuit Breakers (7.3%), Power Cables (7.5%), Panel Fans (6.4%), Phase Reactors (7.7%), MCBs (4.8%).
- **Critical Gaps (0% Coverage):**
  - ❌ `POWER_SUPPLY` (DIN-rail 24V DC units like `PS12`)
  - ❌ `TERMINAL_BLOCK` (Modular terminal strips like `X3`)
  - ❌ `LABEL` (Adhesive component faceplate labels like `1CBP03`)
  - ❌ `FERRULE` (Wire sleeve markers & crimps like `X3-01`)
  - ❌ `RELAY` (Control relays & timer relays)

---

## 4. EAGLE EYE Required Visual Classes

To establish a comprehensive cabinet inspection taxonomy, candidate visual classes were evaluated and categorized:

| Candidate Class | Classification | Justification |
| :--- | :---: | :--- |
| `POWER_SUPPLY` | **A. MUST HAVE** | Essential for detecting 24V DC power supply modules (Planted Fault 1: `PS12`). |
| `TERMINAL_BLOCK` | **A. MUST HAVE** | Essential for localizing terminal strip assemblies (Planted Fault 4: `X3`). |
| `CIRCUIT_BREAKER` / `MCB` | **A. MUST HAVE** | Essential for detecting MCBs, MCCBs, and ACBs (Planted Fault 2: `CB43`/`CB44`, Planted Fault 3: `1CBP03`). |
| `LABEL` | **A. MUST HAVE** | Essential ROI detector for targeting OCR bounding boxes on component tags. |
| `FERRULE` | **A. MUST HAVE** | Essential for wire sleeve marker inspection (Planted Fault 4: `X3-01`). |
| `CONTACTOR` | **B. HIGH VALUE** | High frequency component in motor control cabinets. |
| `RELAY` | **B. HIGH VALUE** | Common automation component mounted on DIN rails. |
| `FUSE` | **B. HIGH VALUE** | Common protection component in electrical panels. |
| `BUS_BAR` | **B. HIGH VALUE** | Heavy power distribution distribution element. |
| `POWER_CABLE` | **B. HIGH VALUE** | Incoming/outgoing power line verification. |
| `MAIN_SWITCH` | **C. OPTIONAL** | Main rotary isolators and door-mounted switches. |
| `PANEL_FAN` | **C. OPTIONAL** | Enclosure ventilation units. |
| `DISCONNECTOR` | **C. OPTIONAL** | Secondary power isolation switches. |
| `DIN_RAIL` | **D. SHOULD NOT BE A CLASS** | Metal track background obscured by mounted components; better to detect mounted objects directly. |
| `WIRE` | **D. SHOULD NOT BE A CLASS** | Segmenting every individual wire in dense wire ducts creates bounding box noise; wire endpoints are better handled via terminal block ROIs. |

---

## 5. Planted Fault → Vision Requirements

| Planted Fault | Component Tag | Computer Vision Requirement | System Integration Strategy |
| :--- | :---: | :--- | :--- |
| **Fault 1: Missing Component** | `PS12` | `POWER_SUPPLY` object detection + `LABEL` OCR | YOLO detects physical power supply box; OCR verifies text `"PS12"`. If missing -> `MISSING_COMPONENT`. |
| **Fault 2: Swapped Components** | `CB43`, `CB44` | `CIRCUIT_BREAKER` object detection + `LABEL` OCR + Spatial Reasoning | YOLO detects 2 breaker boxes; OCR reads `"CB43"` and `"CB44"`; `SpatialAnalyzer` computes relative Y-coordinates. If `CB44.center_y < CB43.center_y` -> `ORDER_MISMATCH`. |
| **Fault 3: Missing Label** | `1CBP03` | `CIRCUIT_BREAKER` object detection + `LABEL` ROI detection + OCR | YOLO detects breaker body `1CBP03`; OCR scans label region. Breaker is present but label text is missing -> `LABEL_MISMATCH`. |
| **Fault 4: Missing Ferrule** | `X3` / `X3-01` | `TERMINAL_BLOCK` object detection + `FERRULE` micro-detection + OCR | YOLO locates terminal strip `X3`; micro-detector/OCR checks wire terminal entry points for sleeve `"X3-01"`. If absent -> `FERRULE_MISMATCH`. |

---

## 6. YOLO vs OCR vs Spatial Reasoning

A strict functional separation is maintained across the vision pipeline:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           INPUT PHOTOGRAPH                              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌────────────────────────────────┐                      ┌──────────────────┐
│     YOLO OBJECT DETECT         │                      │    OCR ENGINE    │
│  (WHAT component shape is it?  │                      │ (WHICH text tag  │
│   WHERE is its bounding box?)  │                      │   is printed?)   │
│  e.g. POWER_SUPPLY, BREAKER,   │                      │  e.g. "PS12",    │
│       TERMINAL_BLOCK, LABEL    │                      │  "CB43", "X3"    │
└────────┬───────────────────────┘                      └────────┬─────────┘
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
                        ┌──────────────────────────┐
                        │    SPATIAL REASONING     │
                        │ (HOW are components      │
                        │  arranged in layout?)    │
                        │  e.g. top vs bottom Y-pos│
                        └────────────┬─────────────┘
                                     ▼
                        ┌──────────────────────────┐
                        │   EXPECTED SCHEMATIC     │
                        │  (GA PDF & Wire Excel)   │
                        └────────────┬─────────────┘
                                     ▼
                        ┌──────────────────────────┐
                        │     QC RULE ENGINE       │
                        │  Deterministic PASS/FAIL │
                        └──────────────────────────┘
```

> [!IMPORTANT]
> **Why Component Tags (PS12, CB43, CB44, 1CBP03, X3) Must NOT Be YOLO Classes:**  
> Training separate YOLO classes for specific alphanumeric strings (e.g., a "CB43" class vs a "CB44" class) is an anti-pattern. Visually, a 16A breaker tagged `CB43` and a 16A breaker tagged `CB44` are physically identical. YOLO handles visual geometry (`CIRCUIT_BREAKER`), while OCR extracts text identity (`"CB43"`).

---

## 7. Dataset Gaps

### Conceptual Gap Matrix
| Proposed Master Class | Current Data? | Instance Count | Sufficient? | Needs More Data? | Source Candidate | Acquisition Priority |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| `POWER_SUPPLY` | **NO** | 0 | **NO** | **YES** | Roboflow Control Panels / Custom Photos | **P0** |
| `TERMINAL_BLOCK` | **NO** | 0 | **NO** | **YES** | Roboflow Control Panels / Custom Photos | **P0** |
| `LABEL` | **NO** | 0 | **NO** | **YES** | Custom Cabinet Photos | **P0** |
| `FERRULE` | **NO** | 0 | **NO** | **YES** | Custom Cabinet Close-Ups | **P0** |
| `CIRCUIT_BREAKER` / `MCB` | **YES** | 747 | **PARTIAL** | **YES** | Roboflow Control Panels | **P1** |
| `CONTACTOR` | **YES** | 1,015 | **YES** | **MINOR** | Current Dataset | **P1** |
| `RELAY` | **NO** | 0 | **NO** | **YES** | Roboflow Control Panels | **P1** |
| `FUSE` | **YES** | 847 | **YES** | **MINOR** | Current Dataset | **P2** |
| `BUS_BAR` | **YES** | 1,206 | **YES** | **NO** | Current Dataset | **P2** |
| `POWER_CABLE` | **YES** | 464 | **YES** | **MINOR** | Current Dataset | **P2** |
| `MAIN_SWITCH` | **NO** | 0 | **NO** | **YES** | Roboflow Control Panels | **P2** |
| `PANEL_FAN` | **YES** | 394 | **YES** | **NO** | Current Dataset | **P3** |

---

## 8. Control Panels Dataset Contribution
Evaluating the *Roboflow Control Panels* dataset (`control-panel-azure/control-panels`):

### Expected Contributions
- **`TERMINAL_BLOCK` / Main Branch Terminals:** Provides real mounted terminal strips inside enclosures.
- **In-Cabinet `CIRCUIT_BREAKER` Multi-Pole Variants:** 1-pole, 2-pole, and 3-pole MCBs captured in control panel context.
- **`RELAY` & `CONTACTOR` Mounting Context:** Component layouts in realistic industrial lighting and mounting angles.
- **`MAIN_SWITCH` / Rotary Isolators:** Front-panel door mounted switches.

### Gaps Not Resolved by Control Panels Dataset
- **Micro-Level `FERRULE` Sleeve Annotations:** Public datasets do not annotate small wire ferrules.
- **Project-Specific Component Labels:** Does not contain project-specific BOM labels (`PS12`, `1CBP03`).

---

## 9. Remaining Dataset Categories

To address remaining gaps after public dataset integration, search for:

1. **Power Supplies (`POWER_SUPPLY`):**
   - *Why Needed:* Detect DIN-rail 24V DC power supply modules for `PS12` inspection.
   - *Preferred Image Type:* High-resolution front/angled photos of DIN-rail power supplies mounted in control cabinets.
   - *Preferred Annotation:* Bounding box (`x_center, y_center, width, height`).
   - *Data Preference:* Hybrid (Public Roboflow + Custom cabinet photos).
2. **Terminal Blocks (`TERMINAL_BLOCK`):**
   - *Why Needed:* Detect DIN-rail modular terminal strips for `X3` terminal inspection.
   - *Preferred Image Type:* High-res photos of stacked terminal block assemblies with connected wiring.
   - *Preferred Annotation:* Bounding box around individual terminal slices or full strip assemblies.
   - *Data Preference:* Hybrid (Public datasets + Custom cabinet close-ups).
3. **Wire Ferrules & Sleeve Markers (`FERRULE`):**
   - *Why Needed:* Detect presence/absence of wire ferrules and printed sleeve markers (`X3-01`).
   - *Preferred Image Type:* Macro / close-up photographs focused on terminal block entry ports.
   - *Preferred Annotation:* Bounding boxes around ferrule collars / sleeve text regions.
   - *Data Preference:* **Custom Real Cabinet Photographs** (Public datasets lack micro-level ferrule labels).
4. **Adhesive Component Labels (`LABEL`):**
   - *Why Needed:* Localize component label tags for high-precision OCR text extraction.
   - *Preferred Image Type:* Cabinet component faceplate photos showing adhesive tag labels.
   - *Preferred Annotation:* Tight rectangular bounding boxes around label boundaries.
   - *Data Preference:* Custom Real Cabinet Photographs.

---

## 10. Master Class Taxonomy
The recommended final master YOLO taxonomy for EAGLE EYE consists of **11 practical visual classes**:

```yaml
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

## 11. Recommended Dataset Combination Strategy

### Recommended Strategy: Two-Tier Hierarchical Detection System

1. **Tier 1 (Macro YOLO Detector — Component Level):**
   - Single unified master model (`cabinet_master_yolov8.pt`) operating at 640x640 or 800x800 resolution.
   - Detects macro components: `POWER_SUPPLY`, `CIRCUIT_BREAKER`, `CONTACTOR`, `RELAY`, `TERMINAL_BLOCK`, `FUSE`, `BUS_BAR`, `POWER_CABLE`, `MAIN_SWITCH`, `LABEL`.
2. **Tier 2 (Micro Cropped Detector — Wire & Ferrule Level):**
   - Operates on cropped high-resolution ROIs extracted from Tier 1 `TERMINAL_BLOCK` detections.
   - Detects micro-objects: `FERRULE` and wire entry points at native image resolution.

*Rationale:* A 10x20 pixel ferrule on a 4000x3000 cabinet photograph shrinks to less than 2x3 pixels when resized to 640x640, rendering standard YOLO feature maps blind. Tier 1 ROI cropping before Tier 2 micro-detection preserves critical detail.

---

## 12. Data Acquisition Priority

- **P0 (Absolute Requirement — Planted Faults):**
  - `POWER_SUPPLY` dataset samples
  - `TERMINAL_BLOCK` dataset samples
  - `LABEL` ROI dataset samples
  - `FERRULE` macro dataset samples
- **P1 (High Value — Control Panel Expansion):**
  - `CIRCUIT_BREAKER` multi-pole dataset expansion
  - `CONTACTOR` dataset samples
  - `RELAY` dataset samples
- **P2 (Useful Later — Full Cabinet Generalization):**
  - `FUSE` dataset samples
  - `MAIN_SWITCH` dataset samples
  - `BUS_BAR` & `POWER_CABLE` dataset samples
- **P3 (Unnecessary):**
  - `PANEL_FAN`, `PHASE_REACTOR`, `ACTIVE_HARMONIC_FILTER`, `DIN_RAIL`, `WIRE` (as standalone full bounding boxes).

---

## 13. Real Cabinet Data Requirements

Public datasets cannot fully resolve EAGLE EYE inspection requirements. **Custom Real Cabinet Photographs are mandatory for:**

1. **Planted Fault Verification:** Testing exact physical panel layouts and planted error scenarios (`PS12`, `CB43`/`CB44`, `1CBP03`, `X3`).
2. **Micro-Ferrule Inspection:** Capturing high-resolution close-ups of wire sleeve markers attached to terminal blocks.
3. **Industrial Optical Conditions:** Learning glare on plastic faceplates, shadows inside deep enclosures, and realistic wire obstruction.
4. **Label Format Alignment:** Tuning OCR text preprocessing for specific industrial label tape and engraving fonts.

---

## 14. Risks and Limitations

- **Small-Object Loss:** Direct inference on full cabinet photos without Tier 2 cropping risks missing tiny ferrule markers.
- **OCR Ambiguity:** Low lighting or blurry focus degrades OCR accuracy on printed component tags.
- **Class Definition Overlap:** Merging datasets with conflicting class definitions (e.g., grouping `MCB` vs `CIRCUIT_BREAKER`) requires careful label mapping.

---

## 15. Recommended Next Phase
- **Phase 10E:** Data Acquisition & Dataset Consolidation (Acquire `Control Panels` dataset, capture real cabinet photos for `POWER_SUPPLY`, `TERMINAL_BLOCK`, `LABEL`, and `FERRULE`, and merge into `eagle_eye_master_v1`).
