# EAGLE EYE — PHASE 10G: TERMINAL BLOCK DATASET STAGING REPORT

## 1. Executive Summary
This document reports the successful staging and annotation conversion of the real-world **Zenodo Terminal Strip Dataset** (`datasets/terminal_strip/real_images`) for the **EAGLE EYE** terminal block inspection module (`TERMINAL_BLOCK` / Master Class ID `4`).

A total of **300 high-resolution (1080p) real photographs** and **4,227 terminal block bounding boxes** were harmonized and staged in standard YOLO v8 format under `datasets/staged/terminal_block/`. All non-terminal block accessories (`End Cover`, `Plug-in Bridge`, `Test Adapter`, `CLIPFIX 35`) were intentionally filtered out.

No models were trained, no source dataset files were modified or deleted, and no backend or frontend production code was altered.

---

## 2. Staging Environment & Locations
- **Source Dataset:** Zenodo Real Terminal Strip Dataset (`datasets/terminal_strip/real_images`)
- **Staging Root Directory:** `datasets/staged/terminal_block/`
  - **Staged Images Path:** `datasets/staged/terminal_block/images/`
  - **Staged Labels Path:** `datasets/staged/terminal_block/labels/`

---

## 3. Source & Conversion Statistics

| Metric | Count / Value |
| :--- | :--- |
| **Source Images Processed** | `300` |
| **Source Image Resolution** | `1920 x 1080` (Full HD 1080p) |
| **Source CSV Annotation Files** | `300` |
| **Total Source Bounding Boxes** | `6,502` |
| **Total Source Sub-Classes** | `40` Phoenix Contact classes |
| **Classes Mapped to `TERMINAL_BLOCK` (ID 4)** | `36` terminal block slice classes |
| **Classes Intentionally Excluded** | `4` accessory classes (`End Cover`, `Plug-in Bridge`, `Test Adapter`, `CLIPFIX 35`) |
| **Excluded Accessory Box Count** | `2,275` boxes |
| **Converted Staged Images** | `300` images (`.jpg`) |
| **Converted Staged Labels** | `300` label files (`.txt`) |
| **Total Staged `TERMINAL_BLOCK` Boxes** | **`4,227` boxes** (Class ID `4`) |

---

## 4. Class Harmonization Breakdown

### Mapped Classes → Master Class ID `4` (`TERMINAL_BLOCK`)
36 specific terminal block product model slices were remapped to unified Master Class `4`:
- `UT 4`, `UT 4-TWIN`, `UT 4-MT`, `UT 4-QUATTRO`, `UT 4-TWIN-MT`, `UT 4-QUATTRO-MT`
- `PT 4`, `PT 4-TWIN`, `PT 4-MT`, `PT 4-QUATTRO`
- `PT 2,5`, `PT 2,5-TWIN`, `PT 2,5-MT`, `PT 2,5-QUATTRO`, `PT 2,5-TWIN-MT`, `PT 2,5-QUATTRO-MT`
- `UT 2,5`, `UT 2,5-TWIN`, `UT 2,5-MT`, `UT 2,5-QUATTRO`
- `PT 6`, `PT 6-TWIN`, `PT 6-MT`, `PT 6-QUATTRO`
- `UT 6`, `UT 6-MT`
- `PTS 2,5`, `PTS 2,5-TWIN`, `PTS 2,5-QUATTRO`, `PTS 4`, `PTS 4-TWIN`, `PTS 4-QUATTRO`
- `PTU 2,5`, `PTU 2,5-TWIN`, `PTU 4`, `PTU 4-TWIN`

### Intentionally Excluded Accessory Classes
The following 4 accessory classes were excluded from the YOLO bounding box output files:
1. `End Cover` (994 boxes) — Side end cover plates
2. `Plug-in Bridge` (576 boxes) — Cross-connector jumpers
3. `Test Adapter` (486 boxes) — Test plug adapters
4. `CLIPFIX 35` (219 boxes) — DIN rail end stops

---

## 5. Annotation Integrity & Validation Results

- **Image / Label 1:1 Pairing:** `300 / 300` (100% paired)
- **Malformed Label Files:** `0`
- **Out-of-Range Coordinates (`[0.0, 1.0]`):** `0`
- **Zero-Area Bounding Boxes:** `0`
- **Missing Images / Labels:** `0`
- **Conversion Warnings:** `0`

---

## 6. YOLO Target Label Format
Each converted `.txt` label file contains normalized YOLO format:
```text
class_id x_center y_center width height
```
Sample lines from `terminal_strip_001_1.txt`:
```text
4 0.429427 0.506481 0.022396 0.398148
4 0.319792 0.489815 0.021875 0.268519
4 0.336458 0.488889 0.018750 0.267593
4 0.352604 0.489815 0.016667 0.268519
4 0.367708 0.489815 0.017708 0.266667
```

---

## 7. Recommended Next Phase
- **Phase 10H (Master Dataset Consolidation):** Merge the staged `TERMINAL_BLOCK` dataset (`datasets/staged/terminal_block/`) and Roboflow Control Panels dataset into the unified EAGLE EYE Master Dataset (`datasets/eagle_eye_master_v1/`) and prepare train/val/test splits.
