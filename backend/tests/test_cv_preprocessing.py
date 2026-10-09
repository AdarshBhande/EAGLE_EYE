import os
import sys
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.cv.preprocessing import ImagePreprocessor

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_image_preprocessor_suitable():
    img_path = os.path.join(FIXTURES_DIR, "sample_cabinet.jpg")
    assert os.path.exists(img_path)

    img_bgr, meta = ImagePreprocessor.load_and_preprocess(img_path)

    assert isinstance(img_bgr, np.ndarray)
    assert meta.width == 800
    assert meta.height == 600
    assert meta.quality_status in ("SUITABLE", "WARNING")
    assert meta.brightness > 0.0

def test_image_preprocessor_dark_image():
    img_path = os.path.join(FIXTURES_DIR, "dark_cabinet.jpg")
    assert os.path.exists(img_path)

    img_bgr, meta = ImagePreprocessor.load_and_preprocess(img_path)

    assert meta.quality_status == "WARNING"
    assert any("dark" in reason.lower() for reason in meta.quality_reasons)

def test_image_preprocessor_invalid_path():
    with pytest.raises(FileNotFoundError):
        ImagePreprocessor.load_and_preprocess("non_existent_image.jpg")
