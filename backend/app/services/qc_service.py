import uuid
from datetime import datetime, timezone
from typing import List, Dict, Tuple, Optional
from ..schemas.expected_model import ExpectedCabinetModel
from ..schemas.observed_model import ObservedCabinetModel
from ..schemas.qc import InspectionResult, MatchResult, QCCheck, QCIssue, QCStatus
from ..qc.matching import MatchingEngine
from ..qc.rules import (
    BaseQCRule,
    ComponentPresenceRule,
    ExtraComponentRule,
    ComponentTypeRule,
    ComponentOrderRule,
    LabelRule,
    FerruleRule
)

class QCService:
    """
    Core QC Decision Engine service.
    Orchestrates component matching, rule evaluations, issue extraction, and overall status aggregation.
    """

    def __init__(self, rules: Optional[List[BaseQCRule]] = None):
        self.matching_engine = MatchingEngine()
        self.rules: List[BaseQCRule] = rules or [
            ComponentPresenceRule(),
            ExtraComponentRule(),
            ComponentTypeRule(),
            ComponentOrderRule(),
            LabelRule(),
            FerruleRule()
        ]

    def evaluate_cabinet(
        self,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel
    ) -> InspectionResult:
        """
        Evaluates ExpectedCabinetModel against ObservedCabinetModel.
        Returns complete, deterministic InspectionResult.
        """
        inspection_id = f"INSP-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.now(timezone.utc).isoformat()

        # Step 1: Component Matching
        matches: List[MatchResult] = self.matching_engine.match_components(
            expected_model=expected_model,
            observed_model=observed_model
        )

        # Step 2: Rule Evaluations
        all_checks: List[QCCheck] = []
        all_issues: List[QCIssue] = []
        issue_ids_seen = set()

        for rule in self.rules:
            evaluations = rule.evaluate(
                expected_model=expected_model,
                observed_model=observed_model,
                matches=matches
            )
            for check, issue in evaluations:
                all_checks.append(check)
                if issue and issue.issue_id not in issue_ids_seen:
                    all_issues.append(issue)
                    issue_ids_seen.add(issue.issue_id)

        # Step 3: Status Aggregation
        pass_count = sum(1 for c in all_checks if c.status == QCStatus.PASS)
        fail_count = sum(1 for c in all_checks if c.status == QCStatus.FAIL)
        review_count = sum(1 for c in all_checks if c.status == QCStatus.REVIEW)

        if fail_count > 0:
            overall_status = QCStatus.FAIL
        elif review_count > 0:
            overall_status = QCStatus.REVIEW
        else:
            overall_status = QCStatus.PASS

        summary = {
            "total_checks": len(all_checks),
            "pass_count": pass_count,
            "fail_count": fail_count,
            "review_count": review_count,
            "total_issues": len(all_issues)
        }

        return InspectionResult(
            inspection_id=inspection_id,
            overall_status=overall_status,
            summary=summary,
            matches=matches,
            checks=all_checks,
            issues=all_issues,
            expected_model_id=expected_model.cabinet_id,
            observation_id=observed_model.observation_id,
            timestamp=timestamp
        )
