from typing import List, Set, Dict, Tuple
from ..schemas.expected_model import (
    ExpectedComponent,
    ExpectedWire,
    ExpectedLabel,
    ExpectedFerrule,
    ValidationReport,
    ValidationIssue,
    SourceReference
)

class EngineeringValidator:
    """
    Validates and checks conflicts across extracted GA and Excel reference data.
    """

    def validate(
        self,
        ga_components: List[ExpectedComponent],
        excel_components: List[ExpectedComponent],
        excel_wires: List[ExpectedWire],
        excel_labels: List[ExpectedLabel],
        excel_ferrules: List[ExpectedFerrule],
        ga_metadata: Dict,
        excel_metadata: Dict
    ) -> Tuple[List[ExpectedComponent], ValidationReport]:
        """
        Merges components from GA and Excel, normalizes tags, and evaluates validation issues.
        """
        errors: List[ValidationIssue] = []
        warnings: List[ValidationIssue] = []
        conflicts: List[ValidationIssue] = []

        # Check GA scanned PDF limitation
        if ga_metadata.get("is_scanned_pdf", False):
            warnings.append(ValidationIssue(
                severity="WARNING",
                code="GA_PDF_SCANNED_IMAGE",
                message="GA PDF appears to be a scanned image without vector text. Text extraction fallback applied.",
                source=SourceReference(file=ga_metadata.get("file", "GA.pdf"), type="GA")
            ))

        # Index GA components
        ga_map: Dict[str, ExpectedComponent] = {comp.tag: comp for comp in ga_components}
        excel_map: Dict[str, ExpectedComponent] = {comp.tag: comp for comp in excel_components}

        merged_components_map: Dict[str, ExpectedComponent] = {}

        # 1. Merge GA components
        for tag, ga_comp in ga_map.items():
            merged_components_map[tag] = ga_comp

        # 2. Merge & Cross-Check Excel components
        for tag, excel_comp in excel_map.items():
            if tag in merged_components_map:
                existing = merged_components_map[tag]
                # Check for label mismatch conflict
                if (
                    existing.expected_label 
                    and excel_comp.expected_label 
                    and existing.expected_label.upper() != excel_comp.expected_label.upper()
                ):
                    conflicts.append(ValidationIssue(
                        severity="CONFLICT",
                        code="LABEL_MISMATCH",
                        message=f"Conflict on component '{tag}': GA label '{existing.expected_label}' differs from Excel label '{excel_comp.expected_label}'",
                        component_tag=tag,
                        source=excel_comp.source
                    ))
                # Merge fields: keep drawing_position from GA, fill missing label from Excel
                if not existing.expected_label and excel_comp.expected_label:
                    existing.expected_label = excel_comp.expected_label
            else:
                # Component present in Excel wire list but not explicitly found in GA drawing
                merged_components_map[tag] = excel_comp
                warnings.append(ValidationIssue(
                    severity="WARNING",
                    code="COMPONENT_MISSING_IN_GA",
                    message=f"Component '{tag}' is referenced in Excel wire list but was not detected in GA drawing text.",
                    component_tag=tag,
                    source=excel_comp.source
                ))

        # 3. Check duplicate wire IDs
        seen_wires: Set[str] = set()
        for wire in excel_wires:
            if wire.wire_id in seen_wires:
                warnings.append(ValidationIssue(
                    severity="WARNING",
                    code="DUPLICATE_WIRE_ID",
                    message=f"Duplicate Wire ID detected: '{wire.wire_id}'",
                    wire_id=wire.wire_id,
                    source=wire.source
                ))
            else:
                seen_wires.add(wire.wire_id)

            # Check if source or destination component exists
            if wire.source_component != "UNKNOWN" and wire.source_component not in merged_components_map:
                warnings.append(ValidationIssue(
                    severity="WARNING",
                    code="UNRESOLVED_WIRE_SOURCE",
                    message=f"Wire '{wire.wire_id}' references unknown source component '{wire.source_component}'",
                    wire_id=wire.wire_id,
                    component_tag=wire.source_component,
                    source=wire.source
                ))
            if wire.destination_component != "UNKNOWN" and wire.destination_component not in merged_components_map:
                warnings.append(ValidationIssue(
                    severity="WARNING",
                    code="UNRESOLVED_WIRE_DESTINATION",
                    message=f"Wire '{wire.wire_id}' references unknown destination component '{wire.destination_component}'",
                    wire_id=wire.wire_id,
                    component_tag=wire.destination_component,
                    source=wire.source
                ))

        # Assign layout order
        sorted_components = sorted(merged_components_map.values(), key=lambda c: c.tag)
        for order_idx, comp in enumerate(sorted_components, start=1):
            comp.expected_order = order_idx

        # Determine overall status
        status = "VALID"
        if conflicts:
            status = "CONFLICT"
        elif errors:
            status = "INCOMPLETE"
        elif warnings:
            status = "WARNING"

        report = ValidationReport(
            status=status,
            errors=errors,
            warnings=warnings,
            conflicts=conflicts
        )

        return sorted_components, report
