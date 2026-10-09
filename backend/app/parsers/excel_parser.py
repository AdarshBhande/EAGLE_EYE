import os
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd

from ..schemas.expected_model import (
    ExpectedComponent,
    ExpectedWire,
    ExpectedLabel,
    ExpectedFerrule,
    SourceReference
)
from ..utils.normalization import normalize_tag, infer_component_type

class ExcelParser:
    """
    Parser for Wire and Label List Excel spreadsheets (.xlsx / .xls).
    Extracts components, wires, labels, ferrules, and row traceability.
    """

    COLUMN_MAPS = {
        "tag": ["tag", "component", "component tag", "device", "item", "ref", "ref des"],
        "wire_id": ["wire id", "wire", "wire no", "wire number", "wire_id", "id"],
        "source": ["source", "from", "origin", "from component", "source_component"],
        "destination": ["destination", "dest", "to", "target", "to component", "destination_component"],
        "colour": ["colour", "color", "wire colour", "wire color"],
        "label": ["label", "label tag", "component label", "wire label"],
        "ferrule": ["ferrule", "ferrule id", "ferrule tag", "ferrule_no"],
        "terminal": ["terminal", "terminal block", "tb", "terminal_tag"]
    }

    def __init__(self, excel_path: str):
        self.excel_path = excel_path
        self.filename = os.path.basename(excel_path)

    def parse(self) -> Tuple[
        List[ExpectedComponent],
        List[ExpectedWire],
        List[ExpectedLabel],
        List[ExpectedFerrule],
        Dict[str, Any]
    ]:
        """
        Parses the Excel file across all sheets.
        Returns:
            Tuple of (components, wires, labels, ferrules, metadata)
        """
        if not os.path.exists(self.excel_path):
            raise FileNotFoundError(f"Excel file not found at: {self.excel_path}")

        extracted_components: List[ExpectedComponent] = []
        extracted_wires: List[ExpectedWire] = []
        extracted_labels: List[ExpectedLabel] = []
        extracted_ferrules: List[ExpectedFerrule] = []
        
        seen_tags = set()
        seen_wires = set()
        seen_labels = set()
        seen_ferrules = set()

        excel_file = pd.ExcelFile(self.excel_path)
        sheet_names = excel_file.sheet_names

        for sheet in sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet)
            if df.empty:
                continue

            # Standardize column headers
            header_map = self._map_columns(df.columns)

            for idx, row in df.iterrows():
                row_num = idx + 2  # Excel 1-indexed, header on row 1
                
                # Traceability Reference
                source_ref = SourceReference(
                    file=self.filename,
                    type="EXCEL",
                    sheet=sheet,
                    row=row_num,
                    reference_detail=f"Sheet '{sheet}' Row {row_num}"
                )

                # 1. Component Extraction
                tag_val = self._get_col_value(row, header_map.get("tag"))
                if tag_val:
                    norm_tag = normalize_tag(str(tag_val))
                    if norm_tag and norm_tag not in seen_tags:
                        seen_tags.add(norm_tag)
                        lbl_val = self._get_col_value(row, header_map.get("label"))
                        comp = ExpectedComponent(
                            tag=norm_tag,
                            raw_tag=str(tag_val),
                            component_type=infer_component_type(norm_tag),
                            expected_label=str(lbl_val) if lbl_val else None,
                            source=source_ref,
                            raw_metadata={"sheet": sheet, "row": row_num}
                        )
                        extracted_components.append(comp)

                # 2. Wire Extraction
                wire_id_val = self._get_col_value(row, header_map.get("wire_id"))
                src_val = self._get_col_value(row, header_map.get("source"))
                dst_val = self._get_col_value(row, header_map.get("destination"))

                if wire_id_val or (src_val and dst_val):
                    w_id = normalize_tag(str(wire_id_val)) if wire_id_val else f"WIRE-{len(extracted_wires)+1}"
                    if w_id not in seen_wires:
                        seen_wires.add(w_id)
                        wire = ExpectedWire(
                            wire_id=w_id,
                            source_component=normalize_tag(str(src_val)) if src_val else "UNKNOWN",
                            destination_component=normalize_tag(str(dst_val)) if dst_val else "UNKNOWN",
                            colour=str(self._get_col_value(row, header_map.get("colour")) or ""),
                            label=str(self._get_col_value(row, header_map.get("label")) or ""),
                            ferrule=str(self._get_col_value(row, header_map.get("ferrule")) or ""),
                            terminal=str(self._get_col_value(row, header_map.get("terminal")) or ""),
                            source=source_ref
                        )
                        extracted_wires.append(wire)

                # 3. Label Extraction
                label_text = self._get_col_value(row, header_map.get("label"))
                if label_text:
                    norm_lbl = str(label_text).strip()
                    lbl_key = f"{norm_lbl}_{sheet}_{row_num}"
                    if lbl_key not in seen_labels:
                        seen_labels.add(lbl_key)
                        assoc_comp = normalize_tag(str(tag_val)) if tag_val else None
                        lbl = ExpectedLabel(
                            label_id=f"LBL-{len(extracted_labels)+1}",
                            text=normalize_tag(norm_lbl),
                            raw_text=norm_lbl,
                            component_tag=assoc_comp,
                            source=source_ref
                        )
                        extracted_labels.append(lbl)

                # 4. Ferrule Extraction
                ferrule_text = self._get_col_value(row, header_map.get("ferrule"))
                if ferrule_text:
                    norm_fer = str(ferrule_text).strip()
                    fer_key = f"{norm_fer}_{sheet}_{row_num}"
                    if fer_key not in seen_ferrules:
                        seen_ferrules.add(fer_key)
                        assoc_wire = normalize_tag(str(wire_id_val)) if wire_id_val else None
                        assoc_term = normalize_tag(str(self._get_col_value(row, header_map.get("terminal")) or "")) or None
                        ferrule = ExpectedFerrule(
                            ferrule_id=f"FER-{len(extracted_ferrules)+1}",
                            text=norm_fer,
                            wire_id=assoc_wire,
                            terminal_tag=assoc_term,
                            source=source_ref
                        )
                        extracted_ferrules.append(ferrule)

        excel_file.close()

        metadata = {
            "file": self.filename,
            "sheets_processed": sheet_names,
            "components_found": len(extracted_components),
            "wires_found": len(extracted_wires),
            "labels_found": len(extracted_labels),
            "ferrules_found": len(extracted_ferrules)
        }

        return (
            extracted_components,
            extracted_wires,
            extracted_labels,
            extracted_ferrules,
            metadata
        )

    def _map_columns(self, columns: List[Any]) -> Dict[str, str]:
        """
        Maps raw Excel DataFrame column names to standardized field names.
        """
        mapping = {}
        for col in columns:
            col_str = str(col).strip().lower()
            for std_field, candidates in self.COLUMN_MAPS.items():
                if std_field not in mapping:
                    if col_str in candidates or any(cand in col_str for cand in candidates):
                        mapping[std_field] = str(col)
                        break
        return mapping

    def _get_col_value(self, row: pd.Series, col_name: Optional[str]) -> Optional[Any]:
        if not col_name or col_name not in row.index:
            return None
        val = row[col_name]
        if pd.isna(val) or str(val).strip() == "" or str(val).lower() == "nan":
            return None
        return val
