import os
import cv2
import numpy as np
from PIL import Image, ImageOps
from typing import Tuple, Dict, Any, Union
from ..schemas.observed_model import ImageMetadata

class ImagePreprocessor:
    """
    Image preprocessing and quality assessment pipeline for cabinet photographs.
    """

    @staticmethod
    def load_and_preprocess(image_source: Union[str, bytes, np.ndarray]) -> Tuple[np.ndarray, ImageMetadata]:
        """
        Loads, validates, applies EXIF orientation fixes, and evaluates quality for an image.
        Returns:
            Tuple of (OpenCV BGR numpy array image, ImageMetadata Pydantic object)
        """
        filename = "cabinet_photo.jpg"

        if isinstance(image_source, str):
            filename = os.path.basename(image_source)
            if not os.path.exists(image_source):
                raise FileNotFoundError(f"Cabinet image not found at: {image_source}")
            pil_img = Image.open(image_source)
            pil_img = ImageOps.exif_transpose(pil_img)
            img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        elif isinstance(image_source, bytes):
            nparr = np.frombuffer(image_source, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img_bgr is None:
                raise ValueError("Failed to decode image from byte buffer.")

        elif isinstance(image_source, np.ndarray):
            img_bgr = image_source
        else:
            raise ValueError("Unsupported image source type.")

        if img_bgr is None or img_bgr.size == 0:
            raise ValueError("Invalid or empty image array.")

        height, width = img_bgr.shape[:2]
        aspect_ratio = round(float(width) / float(height), 3) if height > 0 else 0.0

        # Quality Metrics Calculation
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        quality_status = "SUITABLE"
        quality_reasons = []

        if sharpness < 20.0:
            quality_status = "WARNING"
            quality_reasons.append(f"Image may be blurry (Laplacian variance {sharpness:.1f} < 20.0)")

        if brightness < 40.0:
            quality_status = "WARNING"
            quality_reasons.append(f"Image is dark / underexposed (brightness {brightness:.1f} < 40.0)")
        elif brightness > 220.0:
            quality_status = "WARNING"
            quality_reasons.append(f"Image is overexposed / bright (brightness {brightness:.1f} > 220.0)")

        if width < 400 or height < 400:
            quality_status = "WARNING"
            quality_reasons.append(f"Low resolution photograph ({width}x{height}px)")

        metadata = ImageMetadata(
            filename=filename,
            width=width,
            height=height,
            aspect_ratio=aspect_ratio,
            brightness=round(brightness, 2),
            sharpness=round(sharpness, 2),
            quality_status=quality_status,
            quality_reasons=quality_reasons
        )

        return img_bgr, metadata

    @staticmethod
    def enhance_contrast(img_bgr: np.ndarray) -> np.ndarray:
        """
        Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) for label OCR reading.
        """
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
