import os
from typing import Optional, List, Dict, Any
from ..schemas.expected_model import (
    ExpectedCabinetModel,
    SourceReference,
    ExpectedComponent,
    ExpectedWire,
    ExpectedLabel,
    ExpectedFerrule
)
from ..parsers.ga_parser import GAParser
from ..parsers.excel_parser import ExcelParser
from .engineering_validation import EngineeringValidator

class ExpectedModelService:
    """
    Service layer orchestrating reference parsing and ExpectedCabinetModel construction.
    """

    def __init__(self, cabinet_id: str = "CABINET-PROJECT-01"):
        self.cabinet_id = cabinet_id
        self.validator = EngineeringValidator()

    def build_expected_model(
        self,
        ga_pdf_path: Optional[str] = None,
        excel_path: Optional[str] = None,
        metadata_override: Optional[Dict[str, Any]] = None
    ) -> ExpectedCabinetModel:
        """
        Parses GA PDF and Excel reference files and produces a single unified ExpectedCabinetModel.
        """
        ga_components: List[ExpectedComponent] = []
        ga_meta: Dict[str, Any] = {}

        excel_components: List[ExpectedComponent] = []
        excel_wires: List[ExpectedWire] = []
        excel_labels: List[ExpectedLabel] = []
        excel_ferrules: List[ExpectedFerrule] = []
        excel_meta: Dict[str, Any] = {}

        sources: List[SourceReference] = []

        # Parse GA Drawing PDF if provided
        if ga_pdf_path and os.path.exists(ga_pdf_path):
            ga_parser = GAParser(ga_pdf_path)
            ga_components, ga_meta = ga_parser.parse()
            sources.append(SourceReference(file=os.path.basename(ga_pdf_path), type="GA"))

        # Parse Excel Wire List if provided
        if excel_path and os.path.exists(excel_path):
            excel_parser = ExcelParser(excel_path)
            (
                excel_components,
                excel_wires,
                excel_labels,
                excel_ferrules,
                excel_meta
            ) = excel_parser.parse()
            sources.append(SourceReference(file=os.path.basename(excel_path), type="EXCEL"))

        # Merge & Validate
        merged_components, val_report = self.validator.validate(
            ga_components=ga_components,
            excel_components=excel_components,
            excel_wires=excel_wires,
            excel_labels=excel_labels,
            excel_ferrules=excel_ferrules,
            ga_metadata=ga_meta,
            excel_metadata=excel_meta
        )

        model_meta = {
            "cabinet_id": self.cabinet_id,
            "ga_summary": ga_meta,
            "excel_summary": excel_meta
        }
        if metadata_override:
            model_meta.update(metadata_override)

        expected_model = ExpectedCabinetModel(
            cabinet_id=self.cabinet_id,
            metadata=model_meta,
            components=merged_components,
            wires=excel_wires,
            labels=excel_labels,
            ferrules=excel_ferrules,
            validation=val_report,
            sources=sources
        )

        return expected_model
