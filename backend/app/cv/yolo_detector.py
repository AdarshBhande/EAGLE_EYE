import os
from typing import List, Dict, Any
import numpy as np
from .detector import BaseComponentDetector, DetectedObject
from ..core.config import settings

class YOLOComponentDetector(BaseComponentDetector):
    """
    Ultralytics YOLO inference adapter for electrical cabinet component detection.
    """

    def __init__(
        self,
        model_path: str = None,
        conf_thresh: float = None,
        iou_thresh: float = None,
        img_size: int = None,
        device: str = None
    ):
        self.model_path = model_path or settings.VISION_MODEL_PATH
        self.conf_thresh = conf_thresh or settings.VISION_CONFIDENCE_THRESHOLD
        self.iou_thresh = iou_thresh or settings.VISION_IOU_THRESHOLD
        self.img_size = img_size or settings.VISION_IMAGE_SIZE
        self.device = device or settings.VISION_DEVICE

        self.model = None
        self.has_weights = os.path.exists(self.model_path)
        self.load_error = None

        if self.has_weights:
            try:
                from ultralytics import YOLO
                self.model = YOLO(self.model_path)
            except Exception as e:
                self.has_weights = False
                self.load_error = str(e)
        else:
            self.load_error = f"Cabinet component detector weights not found at '{self.model_path}'."

    def detect(self, image: np.ndarray) -> List[DetectedObject]:
        """
        Runs YOLO inference on input OpenCV BGR image if trained weights are loaded.
        """
        if not self.has_weights or self.model is None:
            # Model weights unavailable - return empty list (do not fabricate detections)
            return []

        results = self.model.predict(
            source=image,
            conf=self.conf_thresh,
            iou=self.iou_thresh,
            imgsz=self.img_size,
            device=self.device,
            verbose=False
        )

        detected_objects: List[DetectedObject] = []

        if results and len(results) > 0:
            boxes = results[0].boxes
            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                class_name = self.model.names.get(cls_id, f"class_{cls_id}")

                detected_objects.append(DetectedObject(
                    class_name=class_name,
                    confidence=conf,
                    x1=float(xyxy[0]),
                    y1=float(xyxy[1]),
                    x2=float(xyxy[2]),
                    y2=float(xyxy[3]),
                    raw_metadata={"cls_id": cls_id}
                ))

        return detected_objects

    def get_info(self) -> Dict[str, Any]:
        return {
            "detector_type": "YOLOComponentDetector",
            "model_path": self.model_path,
            "has_weights": self.has_weights,
            "conf_thresh": self.conf_thresh,
            "iou_thresh": self.iou_thresh,
            "device": self.device,
            "load_error": self.load_error
        }
