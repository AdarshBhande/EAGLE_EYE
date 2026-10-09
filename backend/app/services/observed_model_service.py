import os
import uuid
import cv2
import numpy as np
from typing import Union, Optional, List, Dict, Any

from ..schemas.observed_model import (
    ObservedCabinetModel,
    ObservedComponent,
    ObservedLabel,
    ObservedFerruleCandidate,
    BoundingBox,
    ImageMetadata
)
from ..cv.preprocessing import ImagePreprocessor
from ..cv.detector import BaseComponentDetector
from ..cv.yolo_detector import YOLOComponentDetector
from ..cv.spatial import SpatialAnalyzer
from ..ocr.engine import BaseOCREngine
from ..ocr.tesseract_engine import TesseractOCREngine
from ..utils.normalization import normalize_tag, infer_component_type

class ObservedModelService:
    """
    Service constructing ObservedCabinetModel from a cabinet photograph.
    Combines preprocessing, object detection, label OCR, and spatial analysis.
    """

    def __init__(
        self,
        detector: Optional[BaseComponentDetector] = None,
        ocr_engine: Optional[BaseOCREngine] = None,
        observation_id: Optional[str] = None
    ):
        self.detector = detector or YOLOComponentDetector()
        self.ocr_engine = ocr_engine or TesseractOCREngine()
        self.observation_id = observation_id or f"OBS-{uuid.uuid4().hex[:8].upper()}"

    def inspect_image(
        self,
        image_source: Union[str, bytes, np.ndarray],
        storage_dir: Optional[str] = None
    ) -> ObservedCabinetModel:
        """
        Processes cabinet photograph into an ObservedCabinetModel.
        Does NOT perform Expected comparison or PASS/FAIL decisions.
        """
        # 1. Preprocessing & Quality Metrics
        img_bgr, img_meta = ImagePreprocessor.load_and_preprocess(image_source)
        img_h, img_w = img_bgr.shape[:2]

        # 2. Component Detection
        detections = self.detector.detect(img_bgr)
        detector_info = self.detector.get_info()
        ocr_info = self.ocr_engine.get_info()

        observed_components: List[ObservedComponent] = []
        observed_labels: List[ObservedLabel] = []
        observed_ferrules: List[ObservedFerruleCandidate] = []

        for idx, det in enumerate(detections, start=1):
            det_id = f"DET-{idx:03d}"
            bbox = BoundingBox(x1=det.x1, y1=det.y1, x2=det.x2, y2=det.y2)

            # Crop component region safely
            x1_i, y1_i = max(0, int(det.x1)), max(0, int(det.y1))
            x2_i, y2_i = min(img_w, int(det.x2)), min(img_h, int(det.y2))

            crop_path = None
            raw_tag_text = None
            norm_tag_text = None

            if (x2_i > x1_i) and (y2_i > y1_i):
                crop_bgr = img_bgr[y1_i:y2_i, x1_i:x2_i]

                # Save crop image if storage directory provided
                if storage_dir:
                    os.makedirs(storage_dir, exist_ok=True)
                    crop_filename = f"{self.observation_id}_{det_id}.jpg"
                    full_crop_path = os.path.join(storage_dir, crop_filename)
                    cv2.imwrite(full_crop_path, crop_bgr)
                    crop_path = full_crop_path

                # OCR Recognition on Component Region
                ocr_results = self.ocr_engine.recognize(crop_bgr)
                if ocr_results:
                    # Pick highest confidence OCR text
                    best_ocr = max(ocr_results, key=lambda r: r.confidence)
                    if best_ocr.raw_text:
                        raw_tag_text = best_ocr.raw_text
                        norm_tag_text = best_ocr.normalized_text

                        # Register Observed Label
                        observed_labels.append(ObservedLabel(
                            label_id=f"LBL-OBS-{len(observed_labels)+1:03d}",
                            raw_text=best_ocr.raw_text,
                            text=best_ocr.normalized_text,
                            confidence=best_ocr.confidence,
                            bounding_box=bbox,
                            associated_component_id=det_id
                        ))

            # Center coordinates normalized [0.0 - 1.0]
            cx_norm, cy_norm = SpatialAnalyzer.calculate_center_normalized(bbox, img_w, img_h)

            comp_type = infer_component_type(norm_tag_text) if norm_tag_text else det.class_name.upper()

            obs_comp = ObservedComponent(
                detection_id=det_id,
                component_type=comp_type,
                raw_tag=raw_tag_text,
                tag=norm_tag_text,
                confidence=round(det.confidence, 4),
                bounding_box=bbox,
                center_x=cx_norm,
                center_y=cy_norm,
                crop_path=crop_path,
                raw_metadata=det.raw_metadata
            )

            observed_components.append(obs_comp)

        # 3. Spatial Grid Assignment
        observed_components = SpatialAnalyzer.assign_spatial_grid(observed_components)

        detector_summary = {
            "observation_id": self.observation_id,
            "detector": detector_info,
            "ocr": ocr_info,
            "total_detections": len(observed_components)
        }

        return ObservedCabinetModel(
            observation_id=self.observation_id,
            image_metadata=img_meta,
            detected_components=observed_components,
            detected_labels=observed_labels,
            detected_ferrules=observed_ferrules,
            detector_info=detector_summary
        )
