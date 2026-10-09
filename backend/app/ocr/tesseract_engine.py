import cv2
import numpy as np
import shutil
from typing import List, Dict, Any
from .engine import BaseOCREngine, OCRResult
from ..schemas.observed_model import BoundingBox
from ..utils.normalization import normalize_tag

class HeuristicFallbackOCREngine(BaseOCREngine):
    """
    OpenCV contour and aspect-ratio text region extractor used when Tesseract binary is not installed.
    """

    def recognize(self, crop_bgr: np.ndarray) -> List[OCRResult]:
        if crop_bgr is None or crop_bgr.size == 0:
            return []

        gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        results: List[OCRResult] = []
        h_crop, w_crop = crop_bgr.shape[:2]

        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            aspect = w / float(h) if h > 0 else 0
            if 10 < w < w_crop * 0.9 and 8 < h < h_crop * 0.9 and 0.2 < aspect < 8.0:
                bbox = BoundingBox(x1=float(x), y1=float(y), x2=float(x+w), y2=float(y+h))
                # Fallback candidate region (uncertain OCR text)
                results.append(OCRResult(
                    raw_text="",
                    confidence=0.50,
                    bounding_box=bbox
                ))

        return results

    def get_info(self) -> Dict[str, Any]:
        return {
            "ocr_engine": "HeuristicFallbackOCREngine",
            "is_available": True,
            "notes": "OpenCV text region detector fallback"
        }

class TesseractOCREngine(BaseOCREngine):
    """
    Pytesseract engine wrapper with binary executable availability check.
    """

    def __init__(self):
        self.tesseract_binary = shutil.which("tesseract")
        self.is_available = self.tesseract_binary is not None
        self.fallback = HeuristicFallbackOCREngine()

    def recognize(self, crop_bgr: np.ndarray) -> List[OCRResult]:
        if crop_bgr is None or crop_bgr.size == 0:
            return []

        if not self.is_available:
            # Tesseract binary not installed on OS - delegate to fallback without failing
            return self.fallback.recognize(crop_bgr)

        try:
            import pytesseract
            rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
            data = pytesseract.image_to_data(rgb, output_type=pytesseract.Output.DICT)

            results: List[OCRResult] = []
            n_boxes = len(data['text'])

            for i in range(n_boxes):
                text = data['text'][i].strip()
                conf = float(data['conf'][i])

                if text and conf > 0:
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    bbox = BoundingBox(x1=float(x), y1=float(y), x2=float(x+w), y2=float(y+h))
                    results.append(OCRResult(
                        raw_text=text,
                        confidence=conf / 100.0,
                        bounding_box=bbox
                    ))

            return results

        except Exception:
            return self.fallback.recognize(crop_bgr)

    def get_info(self) -> Dict[str, Any]:
        return {
            "ocr_engine": "TesseractOCREngine",
            "is_available": self.is_available,
            "binary_path": self.tesseract_binary,
            "has_executable": self.is_available
        }
