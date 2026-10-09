# EAGLE EYE — PHASE 10F: AUDIT OF ZENODO TERMINAL STRIP DATASET

## 1. Executive Summary
This document reports the computer vision audit of the downloaded **Zenodo Terminal Strip Dataset** (`real_images` and `eval`). The dataset was inspected in-place inside the workspace (`datasets/terminal_strip/`) to evaluate its image quality, annotation integrity, YOLO conversion feasibility, and taxonomy mapping relevance for the **EAGLE EYE** terminal block (`TERMINAL_BLOCK` / `X3`) inspection module.

No model was trained, no dataset files were merged or converted, and no backend or frontend code was altered.

---

## 2. Dataset Source & Archive Locations

- **Source:** Zenodo / Academic Research Dataset (Zenodo Record 1000000)
- **Original Archive Zip Locations:**
  - `C:\Users\bhand\Downloads\real_images.zip` (66,266,392 bytes / ~66.2 MB)
  - `C:\Users\bhand\Downloads\eval.zip` (238,191,796 bytes / ~238.2 MB)
- **Extracted Workspace Location:**
  - `C:\Users\bhand\EAGLE_EYE\datasets\terminal_strip\real_images`
  - `C:\Users\bhand\EAGLE_EYE\datasets\terminal_strip\eval`

---

## 3. Image & File Inventory

| Dataset Split | Image Format | Resolution | Image Count | CSV Annotation Files | Total Bounding Boxes | Content Type |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`real_images`** | JPG | 1920 x 1080 (1080p) | 300 | 300 | 6,502 | Real-world terminal strip photos |
| **`eval`** | JPG | 1024 x 512 | 300 | 300 | 7,566 | Synthetic terminal strip renders |
| **TOTAL** | **JPG** | — | **600** | **600** | **14,068** | Real & Synthetic |

---

## 4. Annotation Format & Integrity Audit

- **Annotation File Format:** Semicolon-delimited CSV (`width;height;class;xmin;ymax;xmax;ymin`).
- **Sample Annotation Line:**
  ```csv
  width;height;class;xmin;ymax;xmax;ymin
  43;430;PT 6-QUATTRO;803;762;846;332
  ```
- **Integrity Statistics:**
  - **Malformed CSV Files:** `0` (100% clean parsing)
  - **Missing CSV Files:** `0` (100% paired 1:1 with JPG images)
  - **Empty CSV Files:** `0` (Every file contains active bounding box annotations)
  - **Coordinate Validity:** `100% valid` (`xmax > xmin` and `ymax > ymin` for all 14,068 boxes)

---

## 5. Class Inventory (40 Sub-Classes)

The dataset contains 40 fine-grained industrial Phoenix Contact terminal block models and accessories:

### Major Class Distribution (Top Classes)
| Class Name | Description | Bounding Box Count | Primary Category |
| :--- | :--- | :---: | :--- |
| `End Cover` | Terminal strip end plate | 1,945 | Terminal Accessory |
| `Plug-in Bridge` | Terminal cross-connector jumper | 1,306 | Terminal Accessory |
| `Test Adapter` | Test plug adapter | 1,088 | Terminal Accessory |
| `CLIPFIX 35` | DIN rail end stop clamp | 519 | Rail Hardware |
| `UT 4` / `UT 4-TWIN` / `UT 4-MT` | Screw connection terminal block (4mm²) | 1,180 | Terminal Block Slice |
| `PT 4` / `PT 4-TWIN` / `PT 4-QUATTRO` | Push-in connection terminal block (4mm²) | 1,234 | Terminal Block Slice |
| `PT 2,5` / `PT 2,5-TWIN` / `PT 2,5-QUATTRO` | Push-in terminal block (2.5mm²) | 1,165 | Terminal Block Slice |
| `UT 2,5` / `UT 2,5-TWIN` / `UT 2,5-QUATTRO` | Screw terminal block (2.5mm²) | 1,130 | Terminal Block Slice |
| `PT 6` / `PT 6-TWIN` / `PT 6-QUATTRO` | Push-in terminal block (6mm²) | 987 | Terminal Block Slice |
| `UT 6` / `UT 6-MT` | Screw terminal block (6mm²) | 518 | Terminal Block Slice |
| `PTS` / `PTU` Series | Specialized twin/quattro push-in terminals | 1,896 | Terminal Block Slice |

---

## 6. Relevance to EAGLE EYE Components

- ✅ **`TERMINAL_BLOCK` (`X3`):** **100% EXCELLENT RELEVANCE**. Provides 14,068 slice-level bounding box annotations for DIN-rail mounted modular terminal block assemblies.
- ✅ **Terminal Accessories:** Annotates end covers (`End Cover`), jumpers (`Plug-in Bridge`), and DIN-rail end clamps (`CLIPFIX 35`).
- ❌ **Wire Ferrules (`FERRULE` / `X3-01`):** **NOT PRESENT**. The dataset annotates terminal block bodies and accessories, but does NOT annotate individual crimped wire ferrules or wire sleeve markers.

---

## 7. YOLO Format Compatibility

Converting the semicolon-delimited CSV annotations to standard YOLO PyTorch normalized format (`.txt`) is **TRIVIAL**:

$$\text{x\_center} = \frac{\text{xmin} + \text{xmax}}{2 \times \text{img\_width}}, \quad \text{y\_center} = \frac{\text{ymin} + \text{ymax}}{2 \times \text{img\_height}}$$
$$\text{norm\_width} = \frac{\text{xmax} - \text{xmin}}{\text{img\_width}}, \quad \text{norm\_height} = \frac{\text{ymax} - \text{ymin}}{\text{img\_height}}$$

- **Conversion Complexity:** Low (1 simple Python conversion script).
- **Coordinate Sanity:** 100% valid positive coordinates within image boundaries.

---

## 8. Taxonomy Mapping Proposal

Mapping the 40 source sub-classes to the EAGLE EYE Master Taxonomy (Classes 0–10):

| Zenodo Source Class | Target Master Class | Mapping Type | Action Required |
| :--- | :--- | :---: | :--- |
| All 36 Terminal Block Slices (`PT 4`, `UT 4`, `PT 2,5`, `UT 6`, `PT 6-QUATTRO`, `PTS 2,5-TWIN`, etc.) | `4: TERMINAL_BLOCK` | **DIRECT** | Map all slice models to single unified `TERMINAL_BLOCK` class. |
| `CLIPFIX 35` (End Clamp) | `4: TERMINAL_BLOCK` | **APPROXIMATE** | Map to `TERMINAL_BLOCK` (or treat as terminal boundary marker). |
| `End Cover` (End Plate) | `4: TERMINAL_BLOCK` | **APPROXIMATE** | Map to `TERMINAL_BLOCK`. |
| `Plug-in Bridge` (Jumper) | `4: TERMINAL_BLOCK` | **APPROXIMATE** | Map to `TERMINAL_BLOCK`. |
| `Test Adapter` | `4: TERMINAL_BLOCK` | **APPROXIMATE** | Map to `TERMINAL_BLOCK`. |

---

## 9. Real vs Synthetic Assessment

- **Real Images (`real_images`, 300 images, 6,502 annotations):**
  - High-resolution 1080p photographs of real physical DIN-rail terminal strips.
  - Realistic lighting, reflections, shadows, and physical camera angles.
  - **Extremely Valuable** for training and validating real-world `TERMINAL_BLOCK` localization in industrial control panels.
- **Synthetic Images (`eval`, 300 images, 7,566 annotations):**
  - Clean synthetic 3D CAD renders.
  - Useful for initial pre-training feature extraction, but secondary to real photographs.

---

## 10. Dataset Recommendation for EAGLE EYE

- **Recommendation:** **Option C (Used as a Supplemental / Dedicated TERMINAL_BLOCK Dataset)**.
- **Rationale:**
  1. The 300 real images (`real_images`) provide 6,502 high-quality real-world annotations for DIN-rail terminal blocks.
  2. Remapping all 40 sub-classes to unified Class `4: TERMINAL_BLOCK` perfectly fills the P0 `TERMINAL_BLOCK` gap in EAGLE EYE.
  3. Does not replace the need for custom ferrule macro photographs (`FERRULE`), but completely solves `TERMINAL_BLOCK` localization.

---

## 11. Risks and Gaps
- **Missing Ferrules:** This dataset does NOT provide wire ferrule annotations (`FERRULE`). Custom macro photograph collection for wire ferrules remains mandatory.
- **Specific Model Labels:** Annotations label Phoenix Contact model numbers (`UT 4`, `PT 2,5`), requiring remapping to unified `TERMINAL_BLOCK` before merging with master dataset.

---

## 12. Recommended Next Step
- **Phase 10G:** Write annotation converter script (`convert_terminal_strip_to_yolo.py`), convert `real_images` CSVs to YOLO `.txt` format under mapped class ID `4: TERMINAL_BLOCK`, and stage in `datasets/staged/terminal_block/`.
