**EAGLE EYE**

**AI Vision for Electrical Cabinet Quality Control**

**PRODUCT REQUIREMENTS DOCUMENT (PRD)**

  -----------------------------------------------------------------------
  **Document Version**                1.0
  ----------------------------------- -----------------------------------
  **Status**                          Hackathon Product Specification

  **Product Type**                    AI-assisted industrial visual
                                      inspection

  **Primary Platform**                Web application; Python-first
                                      implementation

  **Primary Inputs**                  HD cabinet photo + GA drawing
                                      (PDF) + wire/label list (Excel) +
                                      QC checklist
  -----------------------------------------------------------------------

*Source basis: Hackathon Problem Statement #03 --- EAGLE EYE*

# 1. Executive Summary

EAGLE EYE is an AI-assisted quality-control system for electrical
control cabinets. The product converts engineering documents into an
expected cabinet representation, analyzes a cabinet photograph, compares
expected versus observed state, and produces an evidence-backed QC
result. The system is designed to identify missing or misplaced
components, incorrect labels, and incorrect/missing ferrules, with
wiring/color checks as an extensible capability.

The product must not be a hard-coded demonstration. It must operate from
supplied project inputs and be capable of being evaluated on a fresh
cabinet with planted faults. Every FAIL must be traceable to visual
evidence and an expected-versus-found comparison.

# 2. Problem Statement

Electrical control cabinets contain power supplies, breakers, terminals,
controllers and extensive wiring. Technicians assemble cabinets from
engineering drawings, while QC inspectors manually compare the physical
cabinet with the drawing and wire/label information. This process is
slow, repetitive, and susceptible to missed discrepancies.

The hackathon specification asks for a tool that accepts cabinet photos,
drawings, wire/label lists and a QC checklist, then inspects, compares,
reports, and supports re-check after corrections.

The source problem statement explicitly defines five product
capabilities: Upload, Inspect, Compare, Report, and Re-check.
fileciteturn2file2

# 3. Product Goals

-   Automate the first-pass visual QC of electrical cabinets.

-   Convert GA drawing and Excel data into a machine-readable expected
    cabinet model.

-   Detect expected components in cabinet photographs and associate them
    with engineering identifiers.

-   Check component presence, placement/order, label correctness, and
    ferrule correctness.

-   Return clear PASS / FAIL / REVIEW results at checklist-item level.

-   Provide visual proof for every FAIL using bounding boxes and zoomed
    evidence.

-   Allow a technician to upload a corrected photo and re-run failed
    checks.

-   Preserve inspection history and show which issues were closed or
    remain open.

-   Keep checks modular so new QC rules can be added without rewriting
    the core inspection pipeline.

-   Generalize to unseen cabinet photos rather than relying on
    hard-coded sample faults.

# 4. Non-Goals for MVP

-   Electrical safety certification or replacement of a qualified
    electrical inspector.

-   Autonomous physical repair of cabinet components.

-   Full electrical circuit simulation.

-   Guaranteed verification of hidden components that cannot be visually
    observed.

-   Full 3D cabinet reconstruction.

-   Automatic approval of safety-critical work without human review.

# 5. Target Users & Personas

  -----------------------------------------------------------------------
  **Persona**             **Need**                **Primary Workflow**
  ----------------------- ----------------------- -----------------------
  QC Inspector            Needs fast, repeatable  Upload inputs → inspect
                          inspection with         → review FAIL/REVIEW →
                          evidence and an         approve/hand off.
                          auditable checklist.    

  Cabinet Technician      Needs exact locations   Open evidence → fix
                          of issues and a quick   issue → upload re-photo
                          way to confirm fixes.   → re-check.

  Engineering / Project   Needs drawing/list      Validate expected model
  Engineer                consistency and a       → review exceptions →
                          reliable inspection     export report.
                          trail.                  

  Admin / Supervisor      Needs inspection        View reports → track
                          history and             open/closed issues →
                          project-level           export records.
                          visibility.             
  -----------------------------------------------------------------------

# 6. End-to-End Product Workflow

1.  Create inspection: user uploads the HD cabinet photo, GA drawing
    PDF, Excel wire/label list, and applicable QC checklist.

2.  Parse engineering inputs: extract component identifiers, labels,
    expected order/position information, wire/ferrule references, and
    checklist rules.

3.  Build expected cabinet model: normalize the parsed information into
    a common representation.

4.  Analyze cabinet image: detect visible components/labels, OCR text
    and ferrules, and extract spatial information.

5.  Align expected vs. found: associate observed items with expected
    components using identifiers, type, spatial proximity, and
    confidence.

6.  Run QC rules: presence, placement/order, label, ferrule, and
    optional wiring/color rules.

7.  Generate result: PASS, FAIL, or REVIEW per check.

8.  Generate evidence: annotate FAIL locations on the photo and create
    zoomed snippets.

9.  Export report: produce a completed checklist plus machine-readable
    inspection results.

10. Re-check: upload a new photo after corrections; compare against the
    previous inspection and close resolved issues while retaining
    history.

This workflow directly reflects the source specification\'s Upload →
Inspect → Compare → Report → Re-check flow. fileciteturn2file2

# 7. Input Requirements

  ------------------------------------------------------------------------------
  **ID**            **Requirement**   **Priority**      **Acceptance**
  ----------------- ----------------- ----------------- ------------------------
  IN-01             HD cabinet        MUST              JPG/PNG accepted; image
                    photograph                          quality sufficient for
                                                        visual inspection.

  IN-02             GA drawing        MUST              PDF accepted; component
                                                        identifiers and layout
                                                        information extracted.

  IN-03             Wire/label list   MUST              Excel accepted; relevant
                                                        component/wire/ferrule
                                                        references parsed.

  IN-04             QC checklist      MUST              Checklist rules
                                                        represented as
                                                        configurable inspection
                                                        checks.

  IN-05             Re-check photo    MUST              New cabinet photo can be
                                                        associated with an
                                                        existing inspection.
  ------------------------------------------------------------------------------

# 8. Expected Cabinet Representation

The core product abstraction is an Expected Cabinet Model. It is the
normalized representation of what the physical cabinet should contain,
independent of the original PDF/Excel formatting.

-   Component ID / engineering tag (e.g., PS11, PS12, CB41, X3).

-   Component type (power supply, breaker, terminal, baseplate label,
    earth bar, etc.).

-   Expected position or normalized layout coordinates when available.

-   Expected order within a group (e.g., breaker sequence).

-   Expected label text.

-   Expected wire/ferrule relationships.

-   Expected wire color or terminal mapping where available.

-   Source provenance: GA, Excel, checklist, or derived rule.

-   Confidence and parsing status.

-   Validation flags for conflicts between GA and Excel.

The model must preserve provenance so the UI can explain why a
particular expectation exists and so parsing problems can be surfaced as
REVIEW rather than silently converted into FAIL.

# 9. Observed Cabinet Representation

-   Detected object/component bounding box.

-   Detected component category.

-   OCR-extracted engineering label and confidence.

-   OCR-extracted ferrule text and confidence.

-   Spatial position in image coordinates and, after alignment,
    normalized cabinet coordinates.

-   Detected wire/terminal/color evidence where the selected check
    supports it.

-   Association to expected component ID.

-   Detection/OCR confidence and review status.

# 10. Functional Requirements

## 10.1 Upload & Project Setup

  -----------------------------------------------------------------------
  **ID**            **Requirement**   **Priority**      **Acceptance**
  ----------------- ----------------- ----------------- -----------------
  FR-01             Upload cabinet    MUST              Photo appears in
                    photo(s).                           the inspection
                                                        workspace.

  FR-02             Upload GA drawing MUST              PDF is parsed and
                    PDF.                                parsing status is
                                                        shown.

  FR-03             Upload Excel      MUST              Spreadsheet is
                    wire/label list.                    parsed and column
                                                        mapping/status is
                                                        shown.

  FR-04             Select/apply QC   MUST              Rules are loaded
                    checklist.                          for the
                                                        inspection.

  FR-05             Validate inputs   MUST              Missing/invalid
                    before                              inputs produce
                    inspection.                         actionable
                                                        errors.
  -----------------------------------------------------------------------

## 10.2 Engineering Document Parsing

  ------------------------------------------------------------------------------
  **ID**            **Requirement**          **Priority**      **Acceptance**
  ----------------- ------------------------ ----------------- -----------------
  FR-06             Extract engineering tags MUST              Detected tags are
                    from GA drawing.                           listed with
                                                               source/page.

  FR-07             Extract relevant         MUST              Normalized
                    component/wire/ferrule                     records are
                    data from Excel.                           produced.

  FR-08             Merge GA and Excel into  MUST              Conflicts are
                    Expected Cabinet Model.                    flagged instead
                                                               of silently
                                                               overwritten.

  FR-09             Preserve source          SHOULD            Each expected
                    provenance.                                field can be
                                                               traced to a
                                                               source.
  ------------------------------------------------------------------------------

## 10.3 Vision & OCR

  --------------------------------------------------------------------------
  **ID**            **Requirement**      **Priority**      **Acceptance**
  ----------------- -------------------- ----------------- -----------------
  FR-10             Detect visible       MUST              Components are
                    cabinet components.                    localized with
                                                           confidence.

  FR-11             Read device labels.  MUST              Label text is
                                                           extracted and
                                                           associated with a
                                                           component.

  FR-12             Read ferrule text.   MUST              Ferrule evidence
                                                           is extracted
                                                           where visually
                                                           observable.

  FR-13             Detect spatial       MUST              Normalized
                    arrangement/order.                     positions/order
                                                           are available for
                                                           applicable
                                                           checks.

  FR-14             Support uncertain    MUST              Low-confidence
                    detections.                            evidence becomes
                                                           REVIEW rather
                                                           than automatic
                                                           FAIL where
                                                           appropriate.
  --------------------------------------------------------------------------

## 10.4 Comparison & QC Rules

  -------------------------------------------------------------------------
  **ID**            **Requirement**   **Priority**      **Acceptance**
  ----------------- ----------------- ----------------- -------------------
  FR-15             Component         MUST              Expected component
                    presence check.                     missing → FAIL with
                                                        evidence.

  FR-16             Component         MUST              Incorrect
                    placement/order                     order/position →
                    check.                              FAIL with expected
                                                        vs found.

  FR-17             Label check.      MUST              Missing/incorrect
                                                        label → FAIL or
                                                        REVIEW based on
                                                        confidence.

  FR-18             Ferrule check.    MUST              Missing/incorrect
                                                        ferrule → FAIL or
                                                        REVIEW based on
                                                        evidence.

  FR-19             Wire              STRETCH           Wrong observable
                    color/terminal                      color/terminal
                    check.                              mapping is
                                                        reported.

  FR-20             Configurable      SHOULD            New rules can be
                    plug-in checks.                     added without
                                                        rewriting core
                                                        pipeline.
  -------------------------------------------------------------------------

## 10.5 Reporting & Evidence

  -------------------------------------------------------------------------
  **ID**            **Requirement**   **Priority**      **Acceptance**
  ----------------- ----------------- ----------------- -------------------
  FR-21             Checklist result  MUST              Every configured
                    per item.                           check is
                                                        PASS/FAIL/REVIEW.

  FR-22             Expected vs found MUST              Result shows the
                    display.                            expected and
                                                        observed values.

  FR-23             Visual FAIL       MUST              Every FAIL has a
                    annotation.                         box/marker on the
                                                        source photo.

  FR-24             Zoomed snippet.   MUST              Evidence crop is
                                                        available for every
                                                        FAIL.

  FR-25             Export QC report. MUST              Excel/CSV and/or
                                                        PDF report can be
                                                        generated.
  -------------------------------------------------------------------------

## 10.6 Re-check & History

  -----------------------------------------------------------------------
  **ID**            **Requirement**   **Priority**      **Acceptance**
  ----------------- ----------------- ----------------- -----------------
  FR-26             Upload post-fix   MUST              New image starts
                    photo.                              a re-check
                                                        against the same
                                                        expected model.

  FR-27             Re-run failed     MUST              Previously failed
                    checks.                             checks are
                                                        evaluated again.

  FR-28             Close resolved    MUST              Fixed issue
                    issues.                             changes to
                                                        CLOSED/PASS with
                                                        evidence.

  FR-29             Retain unresolved MUST              Still-failing
                    issues.                             issues remain
                                                        OPEN.

  FR-30             Maintain          MUST              Before/after
                    inspection                          results remain
                    history.                            linked.
  -----------------------------------------------------------------------

# 11. Required Sample Fault Coverage

The provided example cabinet contains four planted issues that the
solution must be able to identify:

  --------------------------------------------------------------------------
  **\#**         **Check**      **Expected**   **Observed     **Expected
                                               Fault**        Result**
  -------------- -------------- -------------- -------------- --------------
  1              Power supply   Expected       Missing        FAIL
                 PS12           installed                     

  2              Breaker order  CB41--CB44     CB43 ↔ CB44    FAIL
                                               swapped        

  3              Baseplate      1CBP03         No label       FAIL
                 label                                        

  4              Ferrule on X3  Ferrule fitted No ferrule     FAIL
                 wire                                         
  --------------------------------------------------------------------------

These planted faults and the expected QC behavior are specified in the
hackathon problem statement. fileciteturn2file8

# 12. Proposed System Architecture

The implementation should be modular so document parsing, computer
vision, OCR, comparison rules, reporting, and re-check history can
evolve independently.

  -----------------------------------------------------------------------
  **Layer**               **Technology            **Responsibility**
                          Direction**             
  ----------------------- ----------------------- -----------------------
  Presentation Layer      Streamlit or equivalent Uploads, inspection
                          web UI                  dashboard, evidence
                                                  viewer, reports,
                                                  re-check.

  API / Orchestration     Python service          Runs inspection jobs
                                                  and manages
                                                  project/inspection
                                                  state.

  Document Intelligence   PDF parser + OCR +      Builds Expected Cabinet
                          Excel parser            Model.

  Vision Engine           Object detector + OCR + Builds Observed Cabinet
                          image preprocessing     Model.

  Comparison Engine       Rule-based +            Runs QC checks and
                          confidence-aware        produces
                          matcher                 PASS/FAIL/REVIEW.

  Evidence Engine         OpenCV/PIL              Boxes failures and
                                                  generates snippets.

  Persistence             SQLite/PostgreSQL +     Stores inspections,
                          file/object storage     results, evidence and
                                                  history.

  Reporting               CSV/Excel/PDF generator Produces QC checklist
                                                  and inspection report.
  -----------------------------------------------------------------------

# 13. AI / Computer Vision Strategy

11. Document understanding: parse GA PDFs and Excel lists into
    normalized engineering records.

12. Cabinet image preprocessing: perspective correction, crop/resize,
    illumination normalization and region-of-interest detection.

13. Object detection: train a cabinet-specific detector for component
    classes and/or component families.

14. OCR: run high-resolution OCR on labels and ferrules, using component
    detections to guide crops.

15. Spatial matching: associate observed objects with expected positions
    using normalized coordinates and geometric constraints.

16. Rule engine: execute deterministic checks on the structured
    expected/found models.

17. Confidence fusion: combine detector confidence, OCR confidence and
    geometric consistency.

18. Human review: route ambiguous evidence to REVIEW rather than
    generating an unsupported FAIL.

For the current working baseline, OCR-based photo detection can provide
an executable foundation. For robust physical-component recognition, the
product should add a cabinet-specific trained object detector using
labeled images from the actual hackathon dataset.

# 14. Core Data Model

  -----------------------------------------------------------------------
  **Entity**              **Key Fields**          **Purpose**
  ----------------------- ----------------------- -----------------------
  Project                 project_id, name,       Groups engineering
                          version, created_at     inputs and inspections.

  ExpectedComponent       id, type, label,        Normalized cabinet
                          expected_position,      expectation.
                          order, source,          
                          confidence              

  ExpectedFerrule         wire_id, expected_text, Expected wire-end
                          terminal, source        information.

  Inspection              inspection_id,          One inspection/re-check
                          project_id, image,      run.
                          timestamp, status       

  ObservedComponent       id, type, bbox, label,  Detected physical
                          OCR_confidence,         evidence.
                          detector_confidence     

  CheckResult             check_id, expected,     Atomic QC decision.
                          found, result,          
                          confidence,             
                          evidence_path           

  Issue                   issue_id, check_id,     Tracks issue lifecycle.
                          status, first_seen,     
                          closed_at               

  InspectionHistory       inspection_id,          Links before/after
                          previous_id, changes    re-checks.
  -----------------------------------------------------------------------

# 15. User Experience / Screens

  -----------------------------------------------------------------------
  **Screen**                          **Required Behavior**
  ----------------------------------- -----------------------------------
  1\. Project Setup                   Upload photo, GA PDF, Excel and
                                      checklist; show validation status.

  2\. Expected Cabinet                Show extracted component list,
                                      labels, order and parsing
                                      confidence; allow review of source
                                      mapping.

  3\. Inspection Dashboard            Show overall PASS/FAIL/REVIEW
                                      counts and cabinet image.

  4\. Evidence Viewer                 Click a failed check to jump to its
                                      photo box and zoomed snippet.

  5\. Checklist                       Item-by-item Expected / Found /
                                      Result / Confidence / Evidence.

  6\. Re-check                        Upload corrected photo and show
                                      before/after issue status.

  7\. History & Export                List inspections, open/closed
                                      issues and export report.
  -----------------------------------------------------------------------

# 16. Decision Logic

-   PASS: expected evidence is found and satisfies the rule above the
    configured confidence threshold.

-   FAIL: a required item is demonstrably missing, misplaced,
    mislabeled, or has incorrect/missing ferrule evidence.

-   REVIEW: evidence is ambiguous, low-confidence, occluded, or document
    parsing is insufficient to support an automatic decision.

-   Overall inspection: FAIL if any mandatory check is FAIL; otherwise
    REVIEW if no FAIL exists but one or more mandatory checks require
    human review; otherwise PASS.

# 17. Non-Functional Requirements

  -----------------------------------------------------------------------------
  **ID**            **Requirement**   **Priority**      **Acceptance**
  ----------------- ----------------- ----------------- -----------------------
  NFR-01            Usability         MUST              A new inspector can
                                                        understand the workflow
                                                        without
                                                        electrical-domain
                                                        training.

  NFR-02            Traceability      MUST              Every FAIL links to
                                                        expected value, found
                                                        value, photo evidence
                                                        and check ID.

  NFR-03            Reproducibility   MUST              Same inputs and model
                                                        version produce
                                                        consistent results.

  NFR-04            Extensibility     MUST              QC checks are
                                                        modular/configurable.

  NFR-05            Performance       SHOULD            Target a practical
                                                        inspection response
                                                        suitable for live demo;
                                                        optimize image/model
                                                        inference as needed.

  NFR-06            Privacy           MUST              Uploaded project data
                                                        is treated as
                                                        confidential
                                                        hackathon/project data
                                                        and not publicly
                                                        shared.

  NFR-07            Auditability      MUST              Inspection and re-check
                                                        history is retained.

  NFR-08            Robustness        MUST              Gracefully handle
                                                        unreadable labels,
                                                        incomplete documents
                                                        and low-quality images.
  -----------------------------------------------------------------------------

# 18. Data & Security Requirements

-   Treat cabinet photos, drawings, spreadsheets and reports as
    project-confidential data.

-   Do not expose uploaded files through public URLs by default.

-   Separate project/inspection identifiers from physical file names
    where practical.

-   Log model/version information used for each inspection.

-   Keep original and annotated evidence separately so source images
    remain immutable.

-   For deployment beyond the hackathon, add authentication, role-based
    access, encryption at rest/in transit and retention policies.

# 19. Definition of Done / Acceptance Criteria

-   User can upload HD cabinet photo, GA PDF, Excel wire/label list and
    QC checklist.

-   Tool produces an Expected Cabinet Model from supplied engineering
    inputs.

-   Tool identifies the required planted faults: missing PS12, swapped
    CB43/CB44, missing 1CBP03 label, and missing X3 ferrule.

-   Every failed item is marked on the cabinet photo and has a zoomed
    evidence snippet.

-   Report shows expected vs found and PASS/FAIL status item by item.

-   After the physical fixes, a new photo can be uploaded and previously
    failed items can be re-checked.

-   Fixed issues close while unresolved issues remain open.

-   The implementation does not hard-code the four sample faults.

-   The system can run on a fresh/unseen cabinet input set.

-   The generated report is produced end-to-end without manual editing.

These criteria are aligned with the source Definition of Done and Ground
Rules. fileciteturn2file2

# 20. Success Metrics

-   Fault detection recall: percentage of planted faults correctly
    identified.

-   False-fail rate: percentage of correct items incorrectly marked
    FAIL.

-   Evidence coverage: percentage of FAIL results with valid photo box +
    snippet.

-   OCR accuracy for engineering labels and ferrules.

-   Component detection precision/recall on a held-out cabinet set.

-   Re-check closure accuracy: corrected issues close while unresolved
    issues remain open.

-   Generalization score on an unseen cabinet rather than only the
    sample cabinet.

-   Inspection cycle time from upload to report.

# 21. Development Plan

  -----------------------------------------------------------------------
  **Phase**                           **Scope**
  ----------------------------------- -----------------------------------
  Phase 1 --- Working Baseline        PDF/Excel parsing, OCR,
                                      expected/found models,
                                      deterministic checks, annotated
                                      report, Streamlit UI.

  Phase 2 --- Real Dataset Validation Run against actual hackathon files;
                                      fix schemas, OCR, layout extraction
                                      and evidence quality.

  Phase 3 --- Vision Model            Label cabinet images and
                                      train/fine-tune a component
                                      detector; add geometric matching.

  Phase 4 --- Ferrule & Wiring        High-resolution crop OCR, wire
                                      color/terminal checks and
                                      configurable wiring rules.

  Phase 5 --- Re-check & History      Issue lifecycle, before/after
                                      comparison, persistent inspection
                                      history and exports.

  Phase 6 --- Fresh Cabinet           Blind test on unseen cabinet(s),
  Validation                          tune thresholds, measure false
                                      alarms and prepare live demo.
  -----------------------------------------------------------------------

# 22. Key Risks & Mitigations

  -----------------------------------------------------------------------
  **Risk**                **Impact**              **Mitigation**
  ----------------------- ----------------------- -----------------------
  Small/limited training  Overfitting and poor    Use augmentation,
  dataset                 generalization          transfer learning,
                                                  confidence-aware
                                                  REVIEW, and validate on
                                                  unseen cabinets.

  Occluded/blurred labels Incorrect component     Use detector + OCR +
                          association             geometry; route
                                                  ambiguous cases to
                                                  REVIEW.

  GA PDFs vary in format  Expected model          Use parser adapters,
                          extraction errors       provenance, validation
                                                  and manual confirmation
                                                  of parsed model.

  Excel schemas vary      Incorrect wire/ferrule  Column mapping layer +
                          mapping                 schema validation +
                                                  conflict reporting.

  False alarms            Loss of inspector trust Conservative FAIL
                                                  thresholds; use REVIEW
                                                  for uncertain evidence.

  Perspective/lighting    Poor spatial comparison Perspective correction,
  differences                                     image normalization and
                                                  normalized cabinet
                                                  coordinates.

  Hard-coded sample logic Fails hidden test       Input-driven rules and
                                                  model; no
                                                  sample-specific IDs in
                                                  decision logic.
  -----------------------------------------------------------------------

# 23. Hackathon Deliverables

-   Working web/desktop inspection tool.

-   Source code and reproducible setup instructions.

-   Completed QC checklist/report.

-   Annotated cabinet photos and evidence snippets.

-   Before/after re-check report.

-   Declared AI/ML models, libraries and versions.

-   Live demonstration using the supplied sample and, where available, a
    fresh cabinet test.

-   Five-minute pitch covering problem, solution, architecture, results,
    and generalization.

The source problem statement explicitly asks for a working tool, filled
checklist, marked-up photos, re-check report, plug-in checks, live demo
and source code. fileciteturn2file2

# 24. MVP vs Stretch Scope

  -----------------------------------------------------------------------
  **MVP**                             **Stretch**
  ----------------------------------- -----------------------------------
  • Photo + GA + Excel ingestion      • Wire color and terminal
                                      verification

  • Expected cabinet model            • Automatic perspective
                                      registration

  • Component/label detection         • More advanced document vision /
                                      multimodal parsing

  • Presence, order/position, label   • Active learning from inspector
  and ferrule checks                  corrections

  • PASS/FAIL/REVIEW                  • Project dashboards and analytics

  • Annotated FAIL evidence           • Role-based access and cloud
                                      deployment

  • QC report export                  • Model monitoring and drift
                                      evaluation

  • Re-check of failed items          
  -----------------------------------------------------------------------

# 25. Source & Scope Note

This PRD is grounded in the supplied EAGLE EYE hackathon Problem
Statement #03. Where the problem statement specifies required behavior,
this PRD preserves that requirement. Implementation details such as the
proposed data model, modular architecture, confidence handling, and
development phases are product/engineering recommendations for turning
the challenge into a working system; they are not claims that the source
document itself mandates those exact technologies.

Primary source: VIT P2.pdf / VIT P2(1).pdf, Problem Statement #03 ---
EAGLE EYE. fileciteturn2file8
