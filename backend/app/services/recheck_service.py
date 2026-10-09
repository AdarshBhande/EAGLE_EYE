import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session

from ..database.session import engine, Base
from ..models.inspection import Inspection, InspectionIssue, RecheckComparison
from ..schemas.qc import InspectionResult, QCIssue, QCStatus
from ..schemas.expected_model import ExpectedCabinetModel
from ..schemas.observed_model import ObservedCabinetModel, BoundingBox
from ..schemas.evidence import EvidenceCollection, EvidenceItem, EvidenceReference
from ..schemas.recheck import (
    LifecycleState,
    PersistedIssue,
    PersistedInspection,
    RecheckSummary,
    RecheckResult,
    compute_issue_fingerprint
)

class RecheckService:
    """
    Re-check & Inspection History Lifecycle Engine.
    Handles immutable inspection persistence, issue fingerprinting, before/after comparisons, and lifecycle state tracking.
    """

    def __init__(self):
        # Ensure database tables exist
        Base.metadata.create_all(bind=engine)

    def persist_inspection(
        self,
        inspection_result: InspectionResult,
        expected_model: ExpectedCabinetModel,
        observed_model: ObservedCabinetModel,
        evidence_collection: Optional[EvidenceCollection] = None,
        db: Session = None
    ) -> PersistedInspection:
        """
        Persists a new inspection result and its issues to database as an immutable history record.
        """
        if db is None:
            from ..database.session import SessionLocal
            db = SessionLocal()
            should_close = True
        else:
            should_close = False

        try:
            # Check if inspection_id already exists to prevent duplicate persistence
            existing = db.query(Inspection).filter(Inspection.inspection_id == inspection_result.inspection_id).first()
            if existing:
                return self.get_inspection(inspection_result.inspection_id, db=db)

            # Build evidence map by issue_id
            evidence_map: Dict[str, EvidenceItem] = {}
            if evidence_collection:
                for item in evidence_collection.evidence_items:
                    evidence_map[item.issue_id] = item

            # Create Inspection ORM record
            inspection_orm = Inspection(
                inspection_id=inspection_result.inspection_id,
                cabinet_id=expected_model.cabinet_id,
                overall_status=inspection_result.overall_status.value,
                summary_json=inspection_result.summary,
                expected_model_json=expected_model.model_dump(),
                observed_model_json=observed_model.model_dump(),
                created_at=datetime.now(timezone.utc)
            )
            db.add(inspection_orm)

            # Create InspectionIssue ORM records
            persisted_issues: List[PersistedIssue] = []
            for issue in inspection_result.issues:
                evi_item = evidence_map.get(issue.issue_id)
                evi_ref_json = None
                crop_ref = None
                if evi_item and evi_item.crop_reference:
                    evi_ref_json = evi_item.crop_reference.model_dump()
                    crop_ref = evi_item.crop_reference
                elif evi_item and evi_item.annotated_image_reference:
                    evi_ref_json = evi_item.annotated_image_reference.model_dump()
                    crop_ref = evi_item.annotated_image_reference

                # Compute stable issue fingerprint
                fingerprint = compute_issue_fingerprint(
                    rule_id=issue.rule_id,
                    category=issue.category,
                    expected_value=issue.expected,
                    found_value=issue.found
                )

                bbox_json = None
                bbox_obj = None
                if issue.observed_reference and "bounding_box" in issue.observed_reference:
                    bbox_json = issue.observed_reference["bounding_box"]
                    try:
                        bbox_obj = BoundingBox(**bbox_json)
                    except Exception:
                        pass

                issue_orm = InspectionIssue(
                    issue_id=issue.issue_id,
                    inspection_id=inspection_result.inspection_id,
                    rule_id=issue.rule_id,
                    category=issue.category,
                    expected_value=issue.expected,
                    found_value=issue.found,
                    reason=issue.reason,
                    status=issue.status.value,
                    lifecycle_state=LifecycleState.OPEN.value,
                    fingerprint=fingerprint,
                    bounding_box_json=bbox_json,
                    evidence_reference_json=evi_ref_json,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(issue_orm)

                persisted_issues.append(
                    PersistedIssue(
                        issue_id=issue.issue_id,
                        inspection_id=inspection_result.inspection_id,
                        rule_id=issue.rule_id,
                        category=issue.category,
                        expected_value=issue.expected,
                        found_value=issue.found,
                        reason=issue.reason,
                        status=issue.status,
                        lifecycle_state=LifecycleState.OPEN,
                        fingerprint=fingerprint,
                        bounding_box=bbox_obj,
                        evidence_reference=crop_ref,
                        created_at=inspection_result.timestamp
                    )
                )

            db.commit()

            return PersistedInspection(
                inspection_id=inspection_result.inspection_id,
                cabinet_id=expected_model.cabinet_id,
                timestamp=inspection_result.timestamp,
                overall_status=inspection_result.overall_status,
                summary=inspection_result.summary,
                expected_model=expected_model,
                observed_model=observed_model,
                issues=persisted_issues
            )
        finally:
            if should_close:
                db.close()

    def get_inspection(self, inspection_id: str, db: Session = None) -> PersistedInspection:
        """
        Retrieves a persisted inspection record from database.
        """
        if db is None:
            from ..database.session import SessionLocal
            db = SessionLocal()
            should_close = True
        else:
            should_close = False

        try:
            inspection_orm = db.query(Inspection).filter(Inspection.inspection_id == inspection_id).first()
            if not inspection_orm:
                raise ValueError(f"Inspection '{inspection_id}' not found.")

            issues_orm = db.query(InspectionIssue).filter(InspectionIssue.inspection_id == inspection_id).all()
            persisted_issues = [self._map_issue_orm_to_pydantic(i) for i in issues_orm]

            return PersistedInspection(
                inspection_id=inspection_orm.inspection_id,
                cabinet_id=inspection_orm.cabinet_id,
                timestamp=inspection_orm.created_at.isoformat(),
                overall_status=QCStatus(inspection_orm.overall_status),
                summary=inspection_orm.summary_json,
                expected_model=ExpectedCabinetModel(**inspection_orm.expected_model_json),
                observed_model=ObservedCabinetModel(**inspection_orm.observed_model_json),
                issues=persisted_issues
            )
        finally:
            if should_close:
                db.close()

    def list_inspections(self, db: Session = None) -> List[PersistedInspection]:
        """
        Lists all persisted inspections in reverse chronological order.
        """
        if db is None:
            from ..database.session import SessionLocal
            db = SessionLocal()
            should_close = True
        else:
            should_close = False

        try:
            inspections_orm = db.query(Inspection).order_by(Inspection.created_at.desc()).all()
            results = []
            for ins in inspections_orm:
                issues_orm = db.query(InspectionIssue).filter(InspectionIssue.inspection_id == ins.inspection_id).all()
                issues = [self._map_issue_orm_to_pydantic(i) for i in issues_orm]
                results.append(
                    PersistedInspection(
                        inspection_id=ins.inspection_id,
                        cabinet_id=ins.cabinet_id,
                        timestamp=ins.created_at.isoformat(),
                        overall_status=QCStatus(ins.overall_status),
                        summary=ins.summary_json,
                        expected_model=ExpectedCabinetModel(**ins.expected_model_json),
                        observed_model=ObservedCabinetModel(**ins.observed_model_json),
                        issues=issues
                    )
                )
            return results
        finally:
            if should_close:
                db.close()

    def perform_recheck(
        self,
        previous_inspection_id: str,
        current_inspection_result: InspectionResult,
        current_expected_model: ExpectedCabinetModel,
        current_observed_model: ObservedCabinetModel,
        current_evidence: Optional[EvidenceCollection] = None,
        db: Session = None
    ) -> RecheckResult:
        """
        Executes recheck comparison: persists current inspection and compares it against previous inspection issues.
        Categorizes issues into RESOLVED, STILL_OPEN, and NEW.
        """
        if db is None:
            from ..database.session import SessionLocal
            db = SessionLocal()
            should_close = True
        else:
            should_close = False

        try:
            # Step 1: Retrieve previous inspection
            previous_inspection = self.get_inspection(previous_inspection_id, db=db)

            # Step 2: Persist current inspection to database
            current_inspection = self.persist_inspection(
                inspection_result=current_inspection_result,
                expected_model=current_expected_model,
                observed_model=current_observed_model,
                evidence_collection=current_evidence,
                db=db
            )

            # Step 3: Compare previous issues vs current issues using deterministic fingerprints
            prev_issue_map = {issue.fingerprint: issue for issue in previous_inspection.issues}
            curr_issue_map = {issue.fingerprint: issue for issue in current_inspection.issues}

            resolved_issues: List[PersistedIssue] = []
            still_open_issues: List[PersistedIssue] = []
            new_issues: List[PersistedIssue] = []

            # 3a. Evaluate previous issues (RESOLVED vs STILL_OPEN)
            for fingerprint, prev_issue in prev_issue_map.items():
                if fingerprint in curr_issue_map:
                    # Issue persists after recheck -> STILL_OPEN
                    curr_issue = curr_issue_map[fingerprint]
                    curr_issue.lifecycle_state = LifecycleState.STILL_OPEN
                    still_open_issues.append(curr_issue)

                    # Update ORM record in DB
                    db.query(InspectionIssue).filter(
                        InspectionIssue.inspection_id == current_inspection.inspection_id,
                        InspectionIssue.fingerprint == fingerprint
                    ).update({"lifecycle_state": LifecycleState.STILL_OPEN.value})

                else:
                    # Issue no longer exists in current inspection -> RESOLVED
                    resolved_issue = PersistedIssue(
                        issue_id=f"RES-{prev_issue.issue_id}",
                        inspection_id=current_inspection.inspection_id,
                        rule_id=prev_issue.rule_id,
                        category=prev_issue.category,
                        expected_value=prev_issue.expected_value,
                        found_value="RESOLVED / OBSERVED CORRECT",
                        reason=f"Defect '{prev_issue.category}' on '{prev_issue.expected_value}' has been fixed and verified.",
                        status=QCStatus.PASS,
                        lifecycle_state=LifecycleState.RESOLVED,
                        fingerprint=fingerprint,
                        bounding_box=prev_issue.bounding_box,
                        evidence_reference=prev_issue.evidence_reference,
                        created_at=datetime.now(timezone.utc).isoformat()
                    )
                    resolved_issues.append(resolved_issue)

            # 3b. Evaluate current issues for NEW issues
            for fingerprint, curr_issue in curr_issue_map.items():
                if fingerprint not in prev_issue_map:
                    # Issue was not present previously -> NEW
                    curr_issue.lifecycle_state = LifecycleState.NEW
                    new_issues.append(curr_issue)

                    db.query(InspectionIssue).filter(
                        InspectionIssue.inspection_id == current_inspection.inspection_id,
                        InspectionIssue.fingerprint == fingerprint
                    ).update({"lifecycle_state": LifecycleState.NEW.value})

            db.commit()

            # Step 4: Aggregate RecheckSummary
            prev_failures_count = len(previous_inspection.issues)
            summary = RecheckSummary(
                previous_failures=prev_failures_count,
                resolved=len(resolved_issues),
                still_open=len(still_open_issues),
                new=len(new_issues),
                final_status=current_inspection_result.overall_status
            )

            comparison_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
            comparison_orm = RecheckComparison(
                comparison_id=comparison_id,
                previous_inspection_id=previous_inspection_id,
                current_inspection_id=current_inspection.inspection_id,
                summary_json=summary.model_dump(),
                resolved_issues_json=[i.model_dump() for i in resolved_issues],
                still_open_issues_json=[i.model_dump() for i in still_open_issues],
                new_issues_json=[i.model_dump() for i in new_issues],
                created_at=datetime.now(timezone.utc)
            )
            db.add(comparison_orm)
            db.commit()

            return RecheckResult(
                comparison_id=comparison_id,
                previous_inspection_id=previous_inspection_id,
                current_inspection_id=current_inspection.inspection_id,
                summary=summary,
                resolved_issues=resolved_issues,
                still_open_issues=still_open_issues,
                new_issues=new_issues,
                created_at=comparison_orm.created_at.isoformat()
            )
        finally:
            if should_close:
                db.close()

    def get_comparison(self, comparison_id: str, db: Session = None) -> RecheckResult:
        """
        Retrieves a stored recheck comparison result by comparison_id.
        """
        if db is None:
            from ..database.session import SessionLocal
            db = SessionLocal()
            should_close = True
        else:
            should_close = False

        try:
            comp_orm = db.query(RecheckComparison).filter(RecheckComparison.comparison_id == comparison_id).first()
            if not comp_orm:
                raise ValueError(f"Comparison '{comparison_id}' not found.")

            return RecheckResult(
                comparison_id=comp_orm.comparison_id,
                previous_inspection_id=comp_orm.previous_inspection_id,
                current_inspection_id=comp_orm.current_inspection_id,
                summary=RecheckSummary(**comp_orm.summary_json),
                resolved_issues=[PersistedIssue(**i) for i in comp_orm.resolved_issues_json],
                still_open_issues=[PersistedIssue(**i) for i in comp_orm.still_open_issues_json],
                new_issues=[PersistedIssue(**i) for i in comp_orm.new_issues_json],
                created_at=comp_orm.created_at.isoformat()
            )
        finally:
            if should_close:
                db.close()

    def _map_issue_orm_to_pydantic(self, issue_orm: InspectionIssue) -> PersistedIssue:
        """
        Converts an InspectionIssue ORM instance to a Pydantic PersistedIssue schema.
        """
        bbox = BoundingBox(**issue_orm.bounding_box_json) if issue_orm.bounding_box_json else None
        evi_ref = EvidenceReference(**issue_orm.evidence_reference_json) if issue_orm.evidence_reference_json else None

        return PersistedIssue(
            issue_id=issue_orm.issue_id,
            inspection_id=issue_orm.inspection_id,
            rule_id=issue_orm.rule_id,
            category=issue_orm.category,
            expected_value=issue_orm.expected_value,
            found_value=issue_orm.found_value,
            reason=issue_orm.reason,
            status=QCStatus(issue_orm.status),
            lifecycle_state=LifecycleState(issue_orm.lifecycle_state),
            fingerprint=issue_orm.fingerprint,
            bounding_box=bbox,
            evidence_reference=evi_ref,
            created_at=issue_orm.created_at.isoformat()
        )
