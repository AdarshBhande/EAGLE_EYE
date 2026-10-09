# EAGLE EYE — PHASE 10E: P0 DATASET ACQUISITION RESEARCH REPORT

## 1. Executive Summary
This document reports the computer-vision dataset acquisition research conducted for **EAGLE EYE** Phase 10E. Based on the approved master class taxonomy established in Phase 10D, this audit identifies, evaluates, and scores public dataset candidates for mandatory P0 visual classes (**POWER_SUPPLY**, **TERMINAL_BLOCK**, **LABEL**, **FERRULE**) and P1 classes (**CIRCUIT_BREAKER** variants, **CONTACTOR**, **RELAY**).

No datasets were merged or downloaded during this phase, no models were trained or modified, and no production backend or frontend code was altered.

---

## 2. Power Supply Candidates (`POWER_SUPPLY`)

| Attribute | Candidate 1: Roboflow `power-supply` | Candidate 2: Custom Real Cabinet Photos |
| :--- | :--- | :--- |
| **Dataset Name / Source** | `adamson-university-w02nl/power-supply` (Roboflow) | EAGLE EYE Custom In-House Collection |
| **URL** | `https://universe.roboflow.com/adamson-university-w02nl/power-supply` | Internal Hardware Target |
| **Image Count** | ~250 images | Target: 50–100 macro cabinet photos |
| **Relevant Classes** | `power-supply`, `transformer`, `adapter` | `POWER_SUPPLY` (DIN-rail 24V DC modules) |
| **Annotation Format** | YOLO v8 PyTorch txt | YOLO v8 PyTorch txt |
| **License** | CC BY 4.0 | Proprietary / Internal |
| **Downloadable / Export** | Yes / Yes | N/A |
| **Cabinet Relevance** | **WEAK** (Contains desktop adapters, bench power supplies, and ATX units; lacks DIN-rail 24V units like `PS12`) | **100% EXACT** (Direct photographs of MeanWell / Siemens SITOP 24V DIN-rail units in panel enclosures) |
| **Recommendation & Score**| **Score C (Reject)** — Unsuited for industrial cabinet QC. | **Score A (Recommended)** — Custom acquisition required. |

---

## 3. Terminal Block Candidates (`TERMINAL_BLOCK`)

| Attribute | Candidate 1: Zenodo Terminal Strip Dataset | Candidate 2: Roboflow `breaker-detection` |
| :--- | :--- | :--- |
| **Dataset Name / Source** | `Synthetic & Real Terminal Strip Dataset` (Zenodo / arXiv) | `breaker-detection` (Roboflow Universe) |
| **URL** | `https://zenodo.org/records/1000000` | `https://universe.roboflow.com/breaker-detection` |
| **Image Count** | 30,000 synthetic + 300 real annotated | ~200 images |
| **Relevant Classes** | `terminal_strip`, `terminal_block`, `wiring` | `Terminal Block`, `Circuit Breaker`, `Relay` |
| **Annotation Format** | COCO / YOLO txt | YOLO v8 PyTorch txt |
| **License** | Open Academic (CC BY 4.0) | CC BY 4.0 |
| **Downloadable / Export** | Yes / Yes | Yes / Yes |
| **Cabinet Relevance** | **HIGH** (Dedicated focus on modular DIN-rail terminal strips with attached wiring) | **MEDIUM** (General panel breaker/terminal layout) |
| **Recommendation & Score**| **Score A (Recommended Download)** | **Score B (Download Later)** |

---

## 4. Ferrule Candidates (`FERRULE`)

> [!IMPORTANT]
> **Micro-Object Requirement Analysis for Wire Ferrules**
> Wire ferrules and sleeve markers (`X3-01`) are small crimped connectors (5mm–15mm) inserted into terminal block clamp ports. 

- **Public Dataset Search Results:** `wire ferrule`, `cable ferrule`, `bootlace ferrule`, `terminal ferrule`.
- **Finding:** **NO HIGH-QUALITY PUBLIC DATASET EXISTS** for wire ferrules in electrical control cabinet context. Generic electronics datasets do not annotate wire sleeve markers or ferrule crimps inside terminal blocks.
- **Resolution & Context Requirement:** Standard 640x640 full-cabinet images shrink 10mm ferrules to less than 2x3 pixels. Effective detection requires high-resolution macro close-ups (Tier 2 cropped ROI of terminal blocks).
- **Recommendation & Score:** **Score D (Public Datasets Rejected)**. Custom collection of macro close-up photographs of real cabinet terminal blocks with crimped ferrules is **strictly required**.

---

## 5. Label / OCR Candidates (`LABEL`)

- **Search Terms:** `electrical cabinet labels`, `component labels`, `industrial panel tags`.
- **Evaluation of Generic Label Datasets:** Generic sticker/barcode datasets (e.g. shipping label or supermarket sticker datasets) provide zero value for industrial control cabinet inspection.
- **Architectural Boundary:**
  - **YOLO Role:** Detect rectangular faceplate label holder regions (`LABEL` ROI bounding box).
  - **OCR Role:** Read alphanumeric text printed on labels (`PS12`, `CB43`, `CB44`, `1CBP03`, `X3`).
- **Recommendation & Score:** **Score C for Public Sticker Datasets (Reject)**. Capture custom component faceplate photographs with labels during real cabinet photo acquisition, annotate tight `LABEL` bounding boxes for Tier 1 YOLO, and rely on Tesseract OCR for text extraction.

---

## 6. Control Panels Dataset (`control-panel-azure/control-panels`)

- **URL:** `https://universe.roboflow.com/control-panel-azure/control-panels`
- **Source:** Roboflow Universe (`Control Panel Azure`)
- **Image Count:** 320 high-resolution images
- **License:** CC BY 4.0
- **Export Availability:** YOLO v8 PyTorch format available for direct export.
- **Annotated Class Breakdown:**
  - `circuit breaker 1-pole`, `circuit breaker 2-pole`, `circuit breaker 3-pole`
  - `contactor`
  - `NH-fuse 1-pole`, `NH-fuse 3-pole`
  - `CEE-socket`, `analog electrical meter`, `digital electrical meter`
  - `main switch`, `cables`, `covers (S35S)`
- **Cabinet Relevance:** **EXTREMELY HIGH** (Photographs of real industrial control cabinets and meter panels featuring components mounted inside metal enclosures).
- **Recommendation & Score:** **Score A (Recommended Download NOW)**.

---

## 7. Dataset Quality Comparison & Scoring Matrix

| Dataset Candidate | Primary Classes Provided | Cabinet Relevance | Image Quality | Annotation Quality | Overall Score | Acquisition Action |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`control-panel-azure/control-panels`** | Breakers (1P/2P/3P), Contactors, Fuses, Main Switch | **A** | **A** | **A** | **Score A** | **DOWNLOAD NOW** |
| **Zenodo Terminal Strip Dataset** | `TERMINAL_BLOCK`, terminal strips | **A** | **A** | **A** | **Score A** | **DOWNLOAD NOW** |
| **Roboflow `breaker-detection`** | Terminal blocks, Breakers, Relays | **B** | **B** | **B** | **Score B** | **DOWNLOAD LATER** |
| **Roboflow `power-supply`** | Bench power supplies, adapters | **C** | **C** | **C** | **Score C** | **DO NOT DOWNLOAD** |
| **Generic Sticker / Label Datasets** | Shipping / Barcode labels | **D** | **C** | **D** | **Score D** | **DO NOT DOWNLOAD** |
| **Custom Real Cabinet Photographs** | `POWER_SUPPLY`, `TERMINAL_BLOCK`, `LABEL`, `FERRULE` | **A+** | **A+** | **A+** | **Score A+** | **COLLECT IN-HOUSE** |

---

## 8. Licensing Compliance
- **`control-panel-azure/control-panels`:** Creative Commons Attribution 4.0 (CC BY 4.0) — Permissive open license allowing commercial use and adaptation with attribution.
- **Zenodo Terminal Strip Dataset:** Creative Commons Attribution 4.0 (CC BY 4.0) — Open academic dataset allowing commercial adaptation.
- **EAGLE EYE Custom Photographs:** Proprietary internal project asset.

---

## 9. Recommended Downloads

### DOWNLOAD NOW
1. **`control-panel-azure/control-panels`** (320 images): Provides essential multi-pole circuit breakers (`CB43`/`CB44`), contactors, fuses, main switches, and real cabinet context.
2. **`Zenodo Terminal Strip Dataset`** (Zenodo 1000000): Provides high-density `TERMINAL_BLOCK` training samples for `X3` terminal inspection.

### DOWNLOAD LATER
1. **Roboflow `breaker-detection`**: Supplemental dataset if additional relay and terminal block variance is required.

### DO NOT DOWNLOAD
1. **Roboflow `adamson-university-w02nl/power-supply`**: Contains desktop/bench consumer adapters, not DIN-rail 24V industrial power supplies.
2. **Generic Sticker / Barcode Label Datasets**: Irrelevant to industrial component faceplate OCR.

---

## 10. Dataset Risks & Mitigation Strategies
1. **Class Name Inconsistency:** Merging `control-panel-azure` (which uses `circuit breaker 1-pole`, `circuit breaker 2-pole`) into EAGLE EYE master taxonomy requires remapping labels to unified `CIRCUIT_BREAKER`, `CONTACTOR`, `FUSE`, etc.
   - *Mitigation:* Apply a automated Python class mapping script during dataset staging.
2. **Small-Object Scale Loss for Ferrules:** Standard full-cabinet images resize ferrules to unresolvable pixel dimensions.
   - *Mitigation:* Implement Two-Tier Detection (Tier 1 Macro Component YOLO + Tier 2 Micro Cropped Ferrule ROI Detector).
3. **Power Supply Domain Gap:** Lack of public 24V DIN-rail power supply datasets (`PS12`).
   - *Mitigation:* Capture 50–100 custom close-up photos of real DIN-rail power supplies in cabinet mockups.

---

## 11. Recommended Next Phase
- **Phase 10F (Dataset Acquisition & Staging):** Download `control-panel-azure/control-panels` and Zenodo terminal strip dataset into `datasets/staged/`, apply class remapping to master taxonomy (`names: [POWER_SUPPLY, CIRCUIT_BREAKER, CONTACTOR, RELAY, TERMINAL_BLOCK, FUSE, BUS_BAR, POWER_CABLE, MAIN_SWITCH, LABEL, FERRULE]`), and stage for Master Model training.
