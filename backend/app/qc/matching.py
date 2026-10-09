from typing import List, Dict, Tuple, Optional, Any
from ..schemas.expected_model import ExpectedCabinetModel, ExpectedComponent
from ..schemas.observed_model import ObservedCabinetModel, ObservedComponent
from ..schemas.qc import MatchResult, MatchStatus
from .spatial_mapping import SpatialMappingService

class MatchingEngine:
    """
    Associates Expected Components with Observed Components using multi-signal analysis.
    Signals: Exact tag, raw tag, component type, spatial order, detection confidence.
    """

    def __init__(self, confidence_threshold: float = 0.60):
        self.confidence_threshold = confidence_threshold

    def match_components(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel
    ) -> List[MatchResult]:
        """
        Main entry point for matching expected vs observed components.
        Returns a list of MatchResult objects for all expected components.
        """
        results: List[MatchResult] = []
        observed_components = list(observed_model.detected_components)
        used_detection_ids = set()

        # Sort observed components spatially for order calculation
        sorted_observed = SpatialMappingService.sort_observed_components(observed_components)

        # Build index map of spatial positions
        observed_order_map = {comp.detection_id: idx for idx, comp in enumerate(sorted_observed)}

        for exp_idx, exp_comp in enumerate(expected_model.components):
            best_match: Optional[ObservedComponent] = None
            best_score = 0.0
            best_signals: Dict[str, Any] = {}
            best_reasoning = ""

            for obs_comp in observed_components:
                if obs_comp.detection_id in used_detection_ids:
                    continue

                score, signals, reasoning = self._evaluate_match_candidate(
                    exp_comp=exp_comp,
                    exp_index=exp_idx,
                    obs_comp=obs_comp,
                    obs_index=observed_order_map.get(obs_comp.detection_id, 0),
                    total_expected=len(expected_model.components),
                    total_observed=len(observed_components)
                )

                if score > best_score:
                    best_score = score
                    best_match = obs_comp
                    best_signals = signals
                    best_reasoning = reasoning

            if best_match and best_score >= self.confidence_threshold:
                used_detection_ids.add(best_match.detection_id)
                results.append(
                    MatchResult(
                        expected_tag=exp_comp.tag,
                        observed_detection_id=best_match.detection_id,
                        observed_tag=best_match.tag,
                        observed_type=best_match.component_type,
                        confidence=round(best_score, 3),
                        status=MatchStatus.MATCHED,
                        signals=best_signals,
                        reasoning=best_reasoning
                    )
                )
            elif best_match and best_score >= 0.35:
                # Moderate candidate but ambiguous or low confidence
                results.append(
                    MatchResult(
                        expected_tag=exp_comp.tag,
                        observed_detection_id=best_match.detection_id,
                        observed_tag=best_match.tag,
                        observed_type=best_match.component_type,
                        confidence=round(best_score, 3),
                        status=MatchStatus.AMBIGUOUS,
                        signals=best_signals,
                        reasoning=f"Ambiguous match (Score {best_score:.2f}): {best_reasoning}"
                    )
                )
            else:
                # No matching observed component found
                results.append(
                    MatchResult(
                        expected_tag=exp_comp.tag,
                        observed_detection_id=None,
                        observed_tag=None,
                        observed_type=None,
                        confidence=0.0,
                        status=MatchStatus.UNMATCHED,
                        signals={"matched": False, "tag_match": False},
                        reasoning=f"No matching observed component found for expected tag '{exp_comp.tag}'."
                    )
                )

        return results

    def _evaluate_match_candidate(
        self,
        exp_comp: ExpectedComponent,
        exp_index: int,
        obs_comp: ObservedComponent,
        obs_index: int,
        total_expected: int,
        total_observed: int
    ) -> Tuple[float, Dict[str, Any], str]:
        """
        Evaluates a single expected vs observed component pair across multiple signals.
        Returns (confidence_score, signals_dict, rationale).
        """
        signals = {
            "exact_tag_match": False,
            "raw_tag_match": False,
            "type_match": False,
            "order_match": False,
            "detection_confidence": obs_comp.confidence
        }
        score = 0.0
        reasons = []

        # Signal 1: Exact Tag Match
        if obs_comp.tag and exp_comp.tag.upper() == obs_comp.tag.upper():
            signals["exact_tag_match"] = True
            score += 0.70
            reasons.append(f"Exact tag match '{exp_comp.tag}'")


        # Signal 2: Raw Tag Match (fuzzy / un-normalized)
        elif obs_comp.raw_tag and (exp_comp.raw_tag.upper() in obs_comp.raw_tag.upper() or obs_comp.raw_tag.upper() in exp_comp.raw_tag.upper()):
            signals["raw_tag_match"] = True
            score += 0.45
            reasons.append(f"Raw OCR tag match '{obs_comp.raw_tag}'")

        # Signal 3: Component Type Match
        if exp_comp.component_type.upper() == obs_comp.component_type.upper():
            signals["type_match"] = True
            score += 0.20
            reasons.append(f"Component type match '{exp_comp.component_type}'")
        elif exp_comp.component_type == "UNKNOWN" or obs_comp.component_type == "UNKNOWN":
            score += 0.10
            reasons.append("Generic type alignment")

        # Signal 4: Order Proximity Alignment
        if total_expected > 1 and total_observed > 1:
            rel_exp = exp_index / max(1, total_expected - 1)
            rel_obs = obs_index / max(1, total_observed - 1)
            dist = abs(rel_exp - rel_obs)
            if dist < 0.25:
                signals["order_match"] = True
                score += 0.20
                reasons.append(f"Spatial relative order match (dist={dist:.2f})")
            elif dist < 0.50:
                score += 0.10

        # Adjust score by detection confidence
        adjusted_score = min(1.0, score * (0.5 + 0.5 * obs_comp.confidence))
        rationale = "; ".join(reasons) if reasons else "Low similarity across signals"

        return adjusted_score, signals, rationale
