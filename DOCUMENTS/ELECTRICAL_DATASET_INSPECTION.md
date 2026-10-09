# EAGLE EYE — ROBOFLOW ELECTRICAL DEVICES DATASET INSPECTION REPORT
**Dataset**: `datasets/Electrical Devices.v6i.yolov8`  
**License**: CC BY 4.0 (Roboflow Universe)  
**Date**: 2026-10-04  
**Author**: EAGLE EYE AI & Computer Vision Engineering Team  

---

## 1. Executive Summary

A comprehensive dataset inspection was conducted on the **Roboflow Electrical Devices YOLOv8 Dataset** (`Electrical Devices.v6i.yolov8`). The dataset comprises **2,870 images** and **6,154 annotated bounding boxes** across **10 electrical device classes**.

The annotation integrity is high with **0 missing label files, 0 malformed files, and 0 out-of-range class IDs**. However, 179 images contain zero annotations (empty `.txt` label files).

The dataset provides strong coverage for heavy electrical components such as **Bus Bars (19.6%)**, **Contactors (16.5%)**, **Fuses (13.8%)**, **Capacitors (12.0%)**, and **Air Circuit Breakers (7.3%)**. However, it **does not contain** terminal blocks, power supplies (e.g., `PS12`), component labels (e.g., `1CBP03`), or wire ferrules (e.g., `X3-01`), which are required for EAGLE EYE's fine-grained cabinet wiring QC.

---

## 2. Dataset Statistics & Split Breakdown

| Dataset Split | Total Images | Total Label Files | Annotated Bounding Boxes | Avg Boxes / Image |
| :--- | :--- | :--- | :--- | :--- |
| **Train** | 2,656 | 2,656 | 5,697 | 2.15 |
| **Valid** | 122 | 122 | 241 | 1.98 |
| **Test** | 92 | 92 | 216 | 2.35 |
| **TOTAL** | **2,870** | **2,870** | **6,154** | **2.14** |

---

## 3. Class Definitions & Distribution (`data.yaml`)

The dataset configuration (`data.yaml`) defines **10 classes** (`nc: 10`):

| Class ID | Class Name | Train Count | Valid Count | Test Count | Total Objects | Class % |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **0** | `Active-Harmonic-Filters` | 253 | 13 | 5 | 271 | 4.40% |
| **1** | `Air-Circuit-Breakers` | 414 | 27 | 9 | 450 | 7.31% |
| **2** | `Bus-Bar` | 1,142 | 34 | 30 | 1,206 | 19.60% |
| **3** | `Capacitors` | 644 | 43 | 49 | 736 | 11.96% |
| **4** | `Contactors` | 971 | 13 | 31 | 1,015 | 16.49% |
| **5** | `Fuses` | 779 | 39 | 29 | 847 | 13.76% |
| **6** | `MCB` (Miniature Circuit Breaker) | 269 | 9 | 19 | 297 | 4.83% |
| **7** | `Panel-Fans` | 351 | 18 | 25 | 394 | 6.40% |
| **8** | `Phase-Reactor` | 446 | 19 | 9 | 474 | 7.70% |
| **9** | `Power-Cable` | 428 | 26 | 10 | 464 | 7.54% |
| **TOTAL** | — | **5,697** | **241** | **216** | **6,154** | **100.00%** |

---

## 4. Annotation Integrity Audit

- **Missing Label Files**: **0** (Every image file has a corresponding `.txt` file in `labels/`).
- **Zero-Annotation Images**: **179** (Images with 0 byte / empty `.txt` files representing background/negative samples).
- **Malformed Label Files**: **0** (All active label lines contain exactly 5 space-delimited floating-point values: `class_id x_center y_center width height`).
- **Class IDs Outside Range**: **0** (All class IDs fall strictly within range `[0, 9]`).

---

## 5. Verification of 10 Representative Training Images

Ten diverse training image samples across all 10 classes were inspected for image dimensions, bounding box counts, and label correctness:

| Sample # | Image Filename | Dimensions | Bboxes | Target Class | All Classes Present |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | `ACTIVEPHASE-Active-Harmonic-Filter-working_png.rf.9446b531...jpg` | 640x640 | 1 | `Active-Harmonic-Filters` | ID 0 (`Active-Harmonic-Filters`) |
| **2** | `Image_11_jpeg.rf.5aa5742ab28f429efabadb81f04c7fe3.jpg` | 640x640 | 1 | `Air-Circuit-Breakers` | ID 1 (`Air-Circuit-Breakers`) |
| **3** | `Image_10_JPG.rf.977114f6d0ad8fa9f945becc88713bad.jpg` | 640x640 | 3 | `Bus-Bar` | ID 2 (`Bus-Bar`) |
| **4** | `Image_13_jpg.rf.0fb133fb52008d82bfb3a5baaef338d8.jpg` | 640x640 | 1 | `Capacitors` | ID 3 (`Capacitors`) |
| **5** | `616LeIaPbaL_jpg.rf.a03413d77340c972176ad6c62ca99c06.jpg` | 640x640 | 1 | `Contactors` | ID 4 (`Contactors`) |
| **6** | `230-voltage-50-hertz-plastic-body-kit-kat-fuses-402_jpg.rf.0431...jpg` | 640x640 | 1 | `Fuses` | ID 5 (`Fuses`) |
| **7** | `Image_10_jpg.rf.01f56e7118cf0ce15ea168572189102a.jpg` | 640x640 | 1 | `MCB` | ID 6 (`MCB`) |
| **8** | `Image_12_jpg.rf.04341bd3640a03761e23546b4c381cca.jpg` | 640x640 | 6 | `Panel-Fans` | ID 6 (`MCB`), ID 7 (`Panel-Fans`), ID 9 (`Power-Cable`) |
| **9** | `Image_10_JPG.rf.78e00de9d7cc3f19787458feefe924e5.jpg` | 640x640 | 1 | `Phase-Reactor` | ID 8 (`Phase-Reactor`) |
| **10** | `3-core-electric-power-cable_jpg.rf.4033001a0dc6543a947922bfa0ebf9c0.jpg` | 640x640 | 1 | `Power-Cable` | ID 9 (`Power-Cable`) |

---

## 6. Coverage Analysis of Component Types

### 6.1 Supported Components (Present in Dataset)
- ✅ **MCB (Miniature Circuit Breakers)**: 297 instances (4.83%)
- ✅ **Air Circuit Breaker**: 450 instances (7.31%)
- ✅ **Contactor**: 1,015 instances (16.49%)
- ✅ **Bus Bar**: 1,206 instances (19.60%)
- ✅ **Power Cable**: 464 instances (7.54%)
- ✅ **Fuse**: 847 instances (13.76%)
- ✅ **Capacitor**: 736 instances (11.96%)

### 6.2 Missing Critical Cabinet Components (Not Present)
- ❌ **Terminal Blocks (`TERMINAL_BLOCK` / `X3`)**: Absent from taxonomy and annotations.
- ❌ **DIN-Rail Power Supplies (`POWER_SUPPLY` / `PS12`)**: Absent from taxonomy and annotations.
- ❌ **Component Faceplate Labels (`COMPONENT_LABEL` / `1CBP03`)**: Absent.
- ❌ **Wire Ferrules & Sleeve Markers (`FERRULE_MARKER` / `X3-01`)**: Absent.

---

## 7. Recommendation for EAGLE EYE

1. **Pre-Training Base Model**: Use this dataset (`datasets/Electrical Devices.v6i.yolov8`) to train a generalized **Industrial Electrical Equipment Detection Base Model** (`yolov8n_electrical_base.pt`). This will establish strong feature extraction weights for breakers, contactors, cables, and bus bars.
2. **Fine-Tuning Requirement**: Supplemental annotations must be added for `POWER_SUPPLY`, `TERMINAL_BLOCK`, `COMPONENT_LABEL`, and `FERRULE_MARKER` before final deployment to support the full EAGLE EYE panel inspection specification.
