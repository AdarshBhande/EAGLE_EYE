import os
import cv2
import uuid
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from pathlib import Path

from ..core.config import settings
from ..schemas.qc import InspectionResult, QCIssue, QCStatus
from ..schemas.observed_model import BoundingBox, ObservedCabinetModel
from ..schemas.evidence import (
    EvidenceItem,
    EvidenceCollection,
    EvidenceReference,
    EvidenceType
)

class EvidenceService:
    """
    Evidence Generator & Visual Proof Service.
    Converts InspectionResult and cabinet photograph into annotated images, defect crops, and evidence cards.
    """

    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = Path(storage_dir or settings.STORAGE_DIR)
        self.evidence_dir = self.storage_dir / "evidence"
        self.crops_dir = self.evidence_dir / "crops"
        self.annotated_dir = self.evidence_dir / "annotated"
        self.cards_dir = self.evidence_dir / "cards"

        # Ensure directories exist
        self.crops_dir.mkdir(parents=True, exist_ok=True)
        self.annotated_dir.mkdir(parents=True, exist_ok=True)
        self.cards_dir.mkdir(parents=True, exist_ok=True)

    def generate_evidence_for_inspection(
        self,
        inspection_result: InspectionResult,
        observed_model: ObservedCabinetModel,
        image_bytes: Optional[bytes] = None,
        image_path: Optional[str] = None
    ) -> EvidenceCollection:
        """
        Main evidence generation pipeline.
        Produces master annotated image and individual EvidenceItems for all FAIL/REVIEW issues.
        """
        # Load source image buffer
        img_np = self._load_image_np(image_bytes=image_bytes, image_path=image_path)
        img_h, img_w = img_np.shape[:2]

        timestamp = datetime.now(timezone.utc).isoformat()
        evidence_items: List[EvidenceItem] = []

        # Step 1: Create master annotated image
        annotated_np = img_np.copy()
        for issue in inspection_result.issues:
            self._draw_issue_on_master_image(annotated_np, issue, observed_model)

        master_filename = f"annotated_{inspection_result.inspection_id}.jpg"
        master_path = self.annotated_dir / master_filename
        cv2.imwrite(str(master_path), annotated_np)

        master_ref = EvidenceReference(
            file_name=master_filename,
            relative_path=f"evidence/annotated/{master_filename}",
            url=f"/evidence/file/annotated/{master_filename}",
            mime_type="image/jpeg",
            width=img_w,
            height=img_h
        )

        # Step 2: Generate individual EvidenceItems for each issue
        for issue in inspection_result.issues:
            evidence_item = self._generate_single_issue_evidence(
                issue=issue,
                inspection_id=inspection_result.inspection_id,
                img_np=img_np,
                observed_model=observed_model,
                master_ref=master_ref,
                source_filename=observed_model.image_metadata.filename
            )
            evidence_items.append(evidence_item)

        return EvidenceCollection(
            inspection_id=inspection_result.inspection_id,
            annotated_full_image=master_ref,
            evidence_items=evidence_items,
            generated_at=timestamp
        )

    def _generate_single_issue_evidence(
        self,
        issue: QCIssue,
        inspection_id: str,
        img_np: np.ndarray,
        observed_model: ObservedCabinetModel,
        master_ref: EvidenceReference,
        source_filename: str
    ) -> EvidenceItem:
        """
        Generates crop, card, and metadata for a single QCIssue.
        """
        evidence_id = f"EVI-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.now(timezone.utc).isoformat()
        bbox = self._extract_issue_bounding_box(issue, observed_model)

        crop_ref: Optional[EvidenceReference] = None
        evidence_type = EvidenceType.DEFECT_CROP if bbox else EvidenceType.EVIDENCE_CARD

        if bbox:
            # Generate zoomed crop with 25% padding
            crop_filename = f"crop_{issue.issue_id}.jpg"
            crop_path = self.crops_dir / crop_filename
            crop_np = self._crop_bounding_box(img_np, bbox, padding_pct=0.25)
            cv2.imwrite(str(crop_path), crop_np)

            ch, cw = crop_np.shape[:2]
            crop_ref = EvidenceReference(
                file_name=crop_filename,
                relative_path=f"evidence/crops/{crop_filename}",
                url=f"/evidence/file/crops/{crop_filename}",
                mime_type="image/jpeg",
                width=cw,
                height=ch
            )
        else:
            # Generate synthetic Evidence Card image for issues without a bounding box
            card_filename = f"card_{issue.issue_id}.jpg"
            card_path = self.cards_dir / card_filename
            card_np = self._render_evidence_card(issue)
            cv2.imwrite(str(card_path), card_np)

            ch, cw = card_np.shape[:2]
            crop_ref = EvidenceReference(
                file_name=card_filename,
                relative_path=f"evidence/cards/{card_filename}",
                url=f"/evidence/file/cards/{card_filename}",
                mime_type="image/jpeg",
                width=cw,
                height=ch
            )

        return EvidenceItem(
            evidence_id=evidence_id,
            issue_id=issue.issue_id,
            inspection_id=inspection_id,
            rule_id=issue.rule_id,
            issue_status=issue.status,
            evidence_type=evidence_type,
            source_image_filename=source_filename,
            bounding_box=bbox,
            crop_reference=crop_ref,
            annotated_image_reference=master_ref,
            expected_value=issue.expected or "N/A",
            found_value=issue.found or "N/A",
            explanation=issue.reason,
            created_at=timestamp,
            details={"confidence_score": issue.confidence_score, "category": issue.category}
        )

    def _draw_issue_on_master_image(
        self,
        img_np: np.ndarray,
        issue: QCIssue,
        observed_model: ObservedCabinetModel
    ) -> None:
        """
        Draws bounding box overlay and text banner on master annotated image.
        """
        color = (0, 0, 255) if issue.status == QCStatus.FAIL else (0, 140, 255) # BGR: Red for FAIL, Orange/Yellow for REVIEW
        bbox = self._extract_issue_bounding_box(issue, observed_model)

        if bbox:
            x1, y1, x2, y2 = int(bbox.x1), int(bbox.y1), int(bbox.x2), int(bbox.y2)
            cv2.rectangle(img_np, (x1, y1), (x2, y2), color, 3)

            label_text = f"[{issue.status.value}] {issue.category}: {issue.expected}"
            cv2.putText(
                img_np,
                label_text[:40],
                (x1, max(15, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2
            )
        else:
            # Draw banner for issues without bounding box (e.g. missing component)
            banner_text = f"[{issue.status.value}] {issue.category} — {issue.reason}"
            cv2.putText(
                img_np,
                banner_text[:60],
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2
            )

    def _crop_bounding_box(self, img_np: np.ndarray, bbox: BoundingBox, padding_pct: float = 0.25) -> np.ndarray:
        """
        Safely crops sub-image rectangle with padding, ensuring bounds stay within image dimensions.
        """
        h, w = img_np.shape[:2]
        bw = bbox.width
        bh = bbox.height

        pad_x = bw * padding_pct
        pad_y = bh * padding_pct

        x1 = max(0, int(bbox.x1 - pad_x))
        y1 = max(0, int(bbox.y1 - pad_y))
        x2 = min(w, int(bbox.x2 + pad_x))
        y2 = min(h, int(bbox.y2 + pad_y))

        # Fallback if crop dimensions are tiny
        if x2 - x1 < 10 or y2 - y1 < 10:
            return img_np

        return img_np[y1:y2, x1:x2]

    def _extract_issue_bounding_box(self, issue: QCIssue, observed_model: ObservedCabinetModel) -> Optional[BoundingBox]:
        """
        Resolves bounding box from issue's observed_reference or observed_model detections.
        """
        if issue.observed_reference and "detection_id" in issue.observed_reference:
            det_id = issue.observed_reference["detection_id"]
            comp = next((c for c in observed_model.detected_components if c.detection_id == det_id), None)
            if comp:
                return comp.bounding_box

        if issue.observed_reference and "bounding_box" in issue.observed_reference:
            raw_bb = issue.observed_reference["bounding_box"]
            return BoundingBox(**raw_bb)

        return None

    def _render_evidence_card(self, issue: QCIssue) -> np.ndarray:
        """
        Renders a synthetic 600x350 dark technical evidence card image for non-spatial issues.
        """
        card = np.zeros((350, 600, 3), dtype=np.uint8)
        card[:] = (26, 26, 26) # Dark background

        # Header banner
        header_color = (0, 0, 220) if issue.status == QCStatus.FAIL else (0, 140, 255)
        cv2.rectangle(card, (0, 0), (600, 50), header_color, -1)
        cv2.putText(card, f"EAGLE EYE — {issue.status.value} EVIDENCE CARD", (15, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        # Category & Rule ID
        cv2.putText(card, f"Category: {issue.category}", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 215, 255), 1)
        cv2.putText(card, f"Rule: {issue.rule_id}", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)

        # Expected vs Found
        cv2.putText(card, f"EXPECTED: {issue.expected or 'N/A'}", (20, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 120), 2)
        cv2.putText(card, f"FOUND:    {issue.found or 'N/A'}", (20, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 100, 255), 2)

        # Reason text (wrapped)
        reason = f"Reason: {issue.reason}"
        cv2.putText(card, reason[:55], (20, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)
        if len(reason) > 55:
            cv2.putText(card, reason[55:110], (20, 275), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)

        cv2.putText(card, f"Issue ID: {issue.issue_id}", (20, 320), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 120, 120), 1)

        return card

    def _load_image_np(self, image_bytes: Optional[bytes], image_path: Optional[str]) -> np.ndarray:
        """
        Loads image array from bytes or disk path safely.
        """
        if image_bytes:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is not None:
                return img

        if image_path and os.path.exists(image_path):
            img = cv2.imread(image_path)
            if img is not None:
                return img

        # Fallback synthetic 800x600 gray image
        img = np.full((600, 800, 3), 128, dtype=np.uint8)
        cv2.putText(img, "Cabinet Photograph Placeholder", (200, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        return img
