from abc import ABC, abstractmethod
from typing import List, Dict, Tuple, Optional, Any
from ..schemas.expected_model import ExpectedCabinetModel, ExpectedComponent, ExpectedLabel, ExpectedFerrule
from ..schemas.observed_model import ObservedCabinetModel, ObservedComponent, ObservedLabel, ObservedFerruleCandidate
from ..schemas.qc import MatchResult, MatchStatus, QCCheck, QCIssue, QCStatus
from .spatial_mapping import SpatialMappingService

class BaseQCRule(ABC):
    """Abstract Base Class for modular QC Rules."""

    def __init__(self, rule_id: str, rule_name: str, description: str):
        self.rule_id = rule_id
        self.rule_name = rule_name
        self.description = description

    @abstractmethod
    def evaluate(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel,
        matches: List[MatchResult]
    ) -> List[Tuple[QCCheck, Optional[QCIssue]]]:
        """
        Evaluates the rule against expected/observed models and match results.
        Returns a list of (QCCheck, QCIssue or None) tuples.
        """
        pass

class ComponentPresenceRule(BaseQCRule):
    """Validates that all expected components are detected in the cabinet photograph."""

    def __init__(self):
        super().__init__(
            rule_id="RULE-PRESENCE-001",
            rule_name="Component Presence Check",
            description="Verifies that all components required by engineering specs are visually observed."
        )

    def evaluate(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel,
        matches: List[MatchResult]
    ) -> List[Tuple[QCCheck, Optional[QCIssue]]]:
        results = []
        match_by_tag = {m.expected_tag: m for m in matches if m.expected_tag}

        image_quality = observed_model.image_metadata.quality_status

        for exp_comp in expected_model.components:
            match = match_by_tag.get(exp_comp.tag)
            check_id = f"CHECK-PRESENCE-{exp_comp.tag}"

            if match and match.status == MatchStatus.MATCHED:
                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.PASS,
                    expected_tag=exp_comp.tag,
                    observed_detection_id=match.observed_detection_id,
                    message=f"Component '{exp_comp.tag}' detected visually.",
                    details={"confidence": match.confidence, "observed_tag": match.observed_tag},
                    evidence_reference={"detection_id": match.observed_detection_id}
                )
                results.append((check, None))

            elif match and match.status == MatchStatus.AMBIGUOUS:
                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.REVIEW,
                    expected_tag=exp_comp.tag,
                    observed_detection_id=match.observed_detection_id,
                    message=f"Observation of component '{exp_comp.tag}' is ambiguous.",
                    details={"reasoning": match.reasoning},
                    evidence_reference={"detection_id": match.observed_detection_id}
                )
                issue = QCIssue(
                    issue_id=f"ISSUE-AMBIGUOUS-{exp_comp.tag}",
                    status=QCStatus.REVIEW,
                    category="AMBIGUOUS_OBSERVATION",
                    expected=f"Component '{exp_comp.tag}' visually verified",
                    found=f"Ambiguous match (Confidence: {match.confidence})",
                    reason=f"Observation of component '{exp_comp.tag}' is ambiguous: {match.reasoning}",
                    confidence_score=match.confidence,
                    expected_reference=exp_comp.source,
                    observed_reference={"detection_id": match.observed_detection_id},
                    rule_id=self.rule_id
                )
                results.append((check, issue))

            else:
                # Component not matched
                if image_quality == "UNSUITABLE":
                    status = QCStatus.REVIEW
                    reason = f"Component '{exp_comp.tag}' not observed, but image quality is UNSUITABLE."
                else:
                    status = QCStatus.FAIL
                    reason = f"Expected component '{exp_comp.tag}' was NOT observed in cabinet photograph."

                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=status,
                    expected_tag=exp_comp.tag,
                    observed_detection_id=None,
                    message=reason,
                    details={"expected_tag": exp_comp.tag, "component_type": exp_comp.component_type}
                )
                issue = QCIssue(
                    issue_id=f"ISSUE-MISSING-{exp_comp.tag}",
                    status=status,
                    category="MISSING_COMPONENT",
                    expected=f"Component '{exp_comp.tag}' ({exp_comp.component_type}) present",
                    found="NOT OBSERVED",
                    reason=reason,
                    confidence_score=1.0 if status == QCStatus.FAIL else 0.5,
                    expected_reference=exp_comp.source,
                    observed_reference=None,
                    rule_id=self.rule_id
                )
                results.append((check, issue))

        return results

class ExtraComponentRule(BaseQCRule):
    """Detects observed physical components that have no corresponding expected engineering spec."""

    def __init__(self):
        super().__init__(
            rule_id="RULE-EXTRA-001",
            rule_name="Unexpected Extra Component Check",
            description="Checks for unexpected components installed in the cabinet that are missing from engineering reference."
        )

    def evaluate(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel,
        matches: List[MatchResult]
    ) -> List[Tuple[QCCheck, Optional[QCIssue]]]:
        results = []
        matched_obs_ids = {m.observed_detection_id for m in matches if m.observed_detection_id and m.status in (MatchStatus.MATCHED, MatchStatus.AMBIGUOUS)}

        for obs_comp in observed_model.detected_components:
            if obs_comp.detection_id not in matched_obs_ids:
                check_id = f"CHECK-EXTRA-{obs_comp.detection_id}"
                tag_desc = obs_comp.tag or obs_comp.raw_tag or obs_comp.detection_id
                message = f"Extra/unexpected component '{tag_desc}' detected in photograph."

                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.REVIEW,
                    expected_tag=None,
                    observed_detection_id=obs_comp.detection_id,
                    message=message,
                    details={"observed_tag": obs_comp.tag, "component_type": obs_comp.component_type},
                    evidence_reference={"detection_id": obs_comp.detection_id}
                )
                issue = QCIssue(
                    issue_id=f"ISSUE-EXTRA-{obs_comp.detection_id}",
                    status=QCStatus.REVIEW,
                    category="EXTRA_COMPONENT",
                    expected="No unmapped components",
                    found=f"Observed component '{tag_desc}' ({obs_comp.component_type})",
                    reason=message,
                    confidence_score=obs_comp.confidence,
                    expected_reference=None,
                    observed_reference={"detection_id": obs_comp.detection_id, "bounding_box": obs_comp.bounding_box.model_dump()},
                    rule_id=self.rule_id
                )
                results.append((check, issue))

        return results


class ComponentTypeRule(BaseQCRule):
    """Validates component type classification matches expected engineering specification."""

    def __init__(self):
        super().__init__(
            rule_id="RULE-TYPE-001",
            rule_name="Component Type Classification Check",
            description="Verifies observed component type matches expected component type."
        )

    def evaluate(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel,
        matches: List[MatchResult]
    ) -> List[Tuple[QCCheck, Optional[QCIssue]]]:
        results = []
        obs_by_id = {c.detection_id: c for c in observed_model.detected_components}

        for match in matches:
            if match.status != MatchStatus.MATCHED or not match.expected_tag or not match.observed_detection_id:
                continue

            exp_comp = next((c for c in expected_model.components if c.tag == match.expected_tag), None)
            obs_comp = obs_by_id.get(match.observed_detection_id)

            if not exp_comp or not obs_comp:
                continue

            check_id = f"CHECK-TYPE-{exp_comp.tag}"
            if exp_comp.component_type.upper() == obs_comp.component_type.upper() or exp_comp.component_type == "UNKNOWN":
                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.PASS,
                    expected_tag=exp_comp.tag,
                    observed_detection_id=obs_comp.detection_id,
                    message=f"Component type for '{exp_comp.tag}' matches ({obs_comp.component_type}).",
                    details={"expected_type": exp_comp.component_type, "observed_type": obs_comp.component_type}
                )
                results.append((check, None))
            else:
                reason = f"Component type mismatch for '{exp_comp.tag}': Expected '{exp_comp.component_type}', found '{obs_comp.component_type}'."
                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.FAIL,
                    expected_tag=exp_comp.tag,
                    observed_detection_id=obs_comp.detection_id,
                    message=reason,
                    details={"expected_type": exp_comp.component_type, "observed_type": obs_comp.component_type}
                )
                issue = QCIssue(
                    issue_id=f"ISSUE-TYPE-{exp_comp.tag}",
                    status=QCStatus.FAIL,
                    category="TYPE_MISMATCH",
                    expected=f"Type '{exp_comp.component_type}'",
                    found=f"Type '{obs_comp.component_type}'",
                    reason=reason,
                    confidence_score=obs_comp.confidence,
                    expected_reference=exp_comp.source,
                    observed_reference={"detection_id": obs_comp.detection_id},
                    rule_id=self.rule_id
                )
                results.append((check, issue))

        return results

class ComponentOrderRule(BaseQCRule):
    """Validates relative spatial positioning and order of matched components."""

    def __init__(self):
        super().__init__(
            rule_id="RULE-ORDER-001",
            rule_name="Component Spatial Order Check",
            description="Verifies component relative ordering in photo matches expected engineering layout sequence."
        )

    def evaluate(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel,
        matches: List[MatchResult]
    ) -> List[Tuple[QCCheck, Optional[QCIssue]]]:
        results = []
        obs_by_id = {c.detection_id: c for c in observed_model.detected_components}

        # Filter matched components with known expected order
        matched_pairs = []
        for match in matches:
            if match.status == MatchStatus.MATCHED and match.expected_tag and match.observed_detection_id:
                exp_comp = next((c for c in expected_model.components if c.tag == match.expected_tag), None)
                obs_comp = obs_by_id.get(match.observed_detection_id)
                if exp_comp and obs_comp and exp_comp.expected_order is not None:
                    matched_pairs.append((exp_comp, obs_comp))

        # Sort by expected order
        matched_pairs.sort(key=lambda pair: pair[0].expected_order)

        # Check adjacent pairs for spatial inversions
        for i in range(len(matched_pairs) - 1):
            exp1, obs1 = matched_pairs[i]
            exp2, obs2 = matched_pairs[i + 1]

            is_valid, explanation = SpatialMappingService.verify_order_pair(obs1, obs2)
            check_id = f"CHECK-ORDER-{exp1.tag}-{exp2.tag}"

            if is_valid:
                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.PASS,
                    expected_tag=f"{exp1.tag},{exp2.tag}",
                    observed_detection_id=f"{obs1.detection_id},{obs2.detection_id}",
                    message=f"Relative order of '{exp1.tag}' -> '{exp2.tag}' is correct.",
                    details={"exp1": exp1.tag, "exp2": exp2.tag}
                )
                results.append((check, None))
            else:
                reason = f"Positional order mismatch between '{exp1.tag}' and '{exp2.tag}'. Expected order: {exp1.tag} -> {exp2.tag}; Observed order: {exp2.tag} -> {exp1.tag}."
                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.FAIL,
                    expected_tag=f"{exp1.tag},{exp2.tag}",
                    observed_detection_id=f"{obs1.detection_id},{obs2.detection_id}",
                    message=reason,
                    details={"expected_order": [exp1.tag, exp2.tag], "observed_order": [exp2.tag, exp1.tag]}
                )
                # Create issue key sorted for stable fingerprinting
                pair_key = "-".join(sorted([exp1.tag, exp2.tag]))
                issue = QCIssue(
                    issue_id=f"ISSUE-ORDER-{pair_key}",
                    status=QCStatus.FAIL,
                    category="ORDER_MISMATCH",
                    expected=f"Order: {exp1.tag} -> {exp2.tag}",
                    found=f"Observed order: {exp2.tag} -> {exp1.tag}",
                    reason=reason,
                    confidence_score=0.95,
                    expected_reference=exp1.source,
                    observed_reference={
                        "detection_id_1": obs1.detection_id,
                        "detection_id_2": obs2.detection_id
                    },
                    rule_id=self.rule_id
                )
                results.append((check, issue))

        return results

class LabelRule(BaseQCRule):
    """Validates component and wire label presence and text correctness."""

    def __init__(self):
        super().__init__(
            rule_id="RULE-LABEL-001",
            rule_name="Text Label Correctness Check",
            description="Verifies component physical labels exist and text matches engineering specification."
        )

    def evaluate(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel,
        matches: List[MatchResult]
    ) -> List[Tuple[QCCheck, Optional[QCIssue]]]:
        results = []
        observed_labels = {l.text.upper(): l for l in observed_model.detected_labels}

        for exp_label in expected_model.labels:
            check_id = f"CHECK-LABEL-{exp_label.label_id}"
            norm_exp = exp_label.text.upper()

            obs_label = observed_labels.get(norm_exp)
            if obs_label:
                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.PASS,
                    expected_tag=exp_label.component_tag or exp_label.label_id,
                    observed_detection_id=obs_label.label_id,
                    message=f"Label '{exp_label.text}' verified visually.",
                    details={"text": obs_label.text, "raw_text": obs_label.raw_text, "confidence": obs_label.confidence}
                )
                results.append((check, None))
            else:
                # Check for partial/fuzzy mismatch among observed labels
                mismatched_obs = next((l for l in observed_model.detected_labels if l.associated_component_id == exp_label.component_tag), None)
                if mismatched_obs:
                    reason = f"Label text mismatch for '{exp_label.component_tag or exp_label.label_id}': Expected '{exp_label.text}', found '{mismatched_obs.text}' (raw OCR: '{mismatched_obs.raw_text}')."
                    status = QCStatus.FAIL
                else:
                    reason = f"Expected label '{exp_label.text}' was NOT observed."
                    status = QCStatus.FAIL if observed_model.image_metadata.quality_status != "UNSUITABLE" else QCStatus.REVIEW

                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=status,
                    expected_tag=exp_label.component_tag or exp_label.label_id,
                    observed_detection_id=mismatched_obs.label_id if mismatched_obs else None,
                    message=reason,
                    details={"expected_text": exp_label.text, "raw_text": exp_label.raw_text}
                )
                issue = QCIssue(
                    issue_id=f"ISSUE-LABEL-{exp_label.label_id}",
                    status=status,
                    category="LABEL_MISMATCH",
                    expected=f"Label '{exp_label.text}'",
                    found=f"'{mismatched_obs.text}'" if mismatched_obs else "NOT OBSERVED",
                    reason=reason,
                    confidence_score=0.90,
                    expected_reference=exp_label.source,
                    observed_reference={"label_id": mismatched_obs.label_id} if mismatched_obs else None,
                    rule_id=self.rule_id
                )
                results.append((check, issue))

        return results

class FerruleRule(BaseQCRule):
    """Validates wire ferrule presence and tag correctness."""

    def __init__(self):
        super().__init__(
            rule_id="RULE-FERRULE-001",
            rule_name="Wire Ferrule Termination Check",
            description="Verifies wire ferrules required by wire list are present and correctly tagged."
        )

    def evaluate(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel,
        matches: List[MatchResult]
    ) -> List[Tuple[QCCheck, Optional[QCIssue]]]:
        results = []
        observed_ferrules = {f.text.upper(): f for f in observed_model.detected_ferrules if f.text}

        for exp_ferrule in expected_model.ferrules:
            check_id = f"CHECK-FERRULE-{exp_ferrule.ferrule_id}"
            norm_exp = exp_ferrule.text.upper()

            obs_ferrule = observed_ferrules.get(norm_exp)
            if obs_ferrule:
                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=QCStatus.PASS,
                    expected_tag=exp_ferrule.terminal_tag or exp_ferrule.ferrule_id,
                    observed_detection_id=obs_ferrule.ferrule_id,
                    message=f"Ferrule '{exp_ferrule.text}' verified visually.",
                    details={"ferrule_text": obs_ferrule.text, "confidence": obs_ferrule.confidence}
                )
                results.append((check, None))
            else:
                # Determine if confidently absent or uncertain
                reason = f"Required wire ferrule '{exp_ferrule.text}' was NOT observed."
                # Default to FAIL if detector explicitly scanned, or REVIEW if uncertain
                status = QCStatus.FAIL if observed_model.image_metadata.quality_status == "SUITABLE" else QCStatus.REVIEW

                check = QCCheck(
                    check_id=check_id,
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    status=status,
                    expected_tag=exp_ferrule.terminal_tag or exp_ferrule.ferrule_id,
                    observed_detection_id=None,
                    message=reason,
                    details={"expected_ferrule": exp_ferrule.text, "wire_id": exp_ferrule.wire_id}
                )
                issue = QCIssue(
                    issue_id=f"ISSUE-FERRULE-{exp_ferrule.ferrule_id}",
                    status=status,
                    category="FERRULE_MISMATCH",
                    expected=f"Ferrule '{exp_ferrule.text}' present",
                    found="NOT OBSERVED",
                    reason=reason,
                    confidence_score=0.85,
                    expected_reference=exp_ferrule.source,
                    observed_reference=None,
                    rule_id=self.rule_id
                )
                results.append((check, issue))

        return results
