import os
import re
from typing import List, Dict, Any, Tuple
import pymupdf  # PyMuPDF

from ..schemas.expected_model import (
    ExpectedComponent,
    DrawingPosition,
    SourceReference
)
from ..utils.normalization import normalize_tag, infer_component_type

class GAParser:
    """
    Parser for General Arrangement (GA) Drawing PDFs.
    Extracts engineering components, tag labels, drawing coordinates, and page references.
    """
    
    # Common engineering tag regex pattern
    TAG_REGEX = re.compile(r'\b([A-Z0-9]{1,6}[\s\-]?\d{1,4}[A-Z]?)\b', re.IGNORECASE)
    KNOWN_PREFIXES = ('PS', 'CB', 'MCB', 'TB', 'X', 'CBP', 'PLC', 'KM', 'K', 'CPU')

    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.filename = os.path.basename(pdf_path)

    def parse(self) -> Tuple[List[ExpectedComponent], Dict[str, Any]]:
        """
        Parses the GA PDF file.
        Returns:
            Tuple of (list of ExpectedComponents, parser metadata dictionary)
        """
        if not os.path.exists(self.pdf_path):
            raise FileNotFoundError(f"GA PDF file not found at: {self.pdf_path}")

        extracted_components: List[ExpectedComponent] = []
        seen_tags = set()
        total_text_length = 0
        pages_processed = 0

        try:
            doc = pymupdf.open(self.pdf_path)
            pages_processed = len(doc)

            for page_idx in range(pages_processed):
                page = doc[page_idx]
                page_num = page_idx + 1
                page_text = page.get_text("text")
                total_text_length += len(page_text.strip())

                # Extract words with bounding boxes: (x0, y0, x1, y1, word, block_no, line_no, word_no)
                words = page.get_text("words")

                for word_tuple in words:
                    x0, y0, x1, y1, word_text = word_tuple[0], word_tuple[1], word_tuple[2], word_tuple[3], word_tuple[4]
                    
                    raw_clean = word_text.strip(",;:")
                    norm_tag = normalize_tag(raw_clean)
                    
                    if self._is_candidate_tag(norm_tag) and norm_tag not in seen_tags:
                        seen_tags.add(norm_tag)
                        
                        comp_type = infer_component_type(norm_tag)
                        
                        source_ref = SourceReference(
                            file=self.filename,
                            type="GA",
                            page=page_num,
                            reference_detail=f"Page {page_num} bbox [{x0:.1f}, {y0:.1f}, {x1:.1f}, {y1:.1f}]"
                        )
                        
                        pos = DrawingPosition(
                            page=page_num,
                            x_min=float(x0),
                            y_min=float(y0),
                            x_max=float(x1),
                            y_max=float(y1),
                            unit="pdf_points"
                        )
                        
                        component = ExpectedComponent(
                            tag=norm_tag,
                            raw_tag=word_text,
                            component_type=comp_type,
                            description=f"Extracted from GA drawing {self.filename} page {page_num}",
                            drawing_position=pos,
                            source=source_ref,
                            raw_metadata={"page": page_num, "word": word_text}
                        )
                        
                        extracted_components.append(component)

            doc.close()

        except Exception as e:
            raise RuntimeError(f"Error reading GA PDF file '{self.filename}': {str(e)}")

        is_scanned = (total_text_length < 20)
        
        metadata = {
            "file": self.filename,
            "pages_processed": pages_processed,
            "total_components_found": len(extracted_components),
            "is_scanned_pdf": is_scanned,
            "has_extractable_text": not is_scanned
        }

        return extracted_components, metadata

    def _is_candidate_tag(self, norm_tag: str) -> bool:
        """
        Validates whether a normalized string matches known engineering component tag patterns.
        """
        if not norm_tag or len(norm_tag) < 2 or len(norm_tag) > 12:
            return False
        
        # Check standard engineering prefixes (including numeric prefixes like 1CBP03)
        pattern = r'^\d*(?:PS|CB|MCB|TB|X|CBP|PLC|KM|K|CPU)\d+$'
        if re.match(pattern, norm_tag):
            return True
            
        for prefix in self.KNOWN_PREFIXES:
            if norm_tag.startswith(prefix) and any(char.isdigit() for char in norm_tag):
                return True
        return False
