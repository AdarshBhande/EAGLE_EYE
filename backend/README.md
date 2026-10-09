# EAGLE EYE — Backend Service

The backend foundation for **EAGLE EYE**, an AI-assisted quality control system for electrical control cabinets.

---

## 1. Architecture Overview

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point & CORS configuration
│   ├── api/
│   │   └── routes/
│   │       ├── health.py        # Health check endpoint route
│   │       ├── engineering.py   # GA PDF & Excel reference ingestion endpoint
│   │       ├── vision.py        # Cabinet photo inspection endpoint
│   │       ├── qc.py            # Quality control evaluation endpoint
│   │       ├── evidence.py      # Visual evidence & defect crops endpoint
│   │       └── recheck.py       # Inspection history & re-check lifecycle endpoint
│   ├── core/
│   │   ├── config.py        # Typed environment settings (Pydantic Settings)
│   │   └── logging.py       # Centralized structured logger
│   ├── database/
│   │   └── session.py       # SQLAlchemy engine, sessionmaker, and Base
│   ├── models/              # ORM models (Inspection, InspectionIssue, RecheckComparison)
│   ├── schemas/             # Pydantic schemas (ExpectedModel, ObservedModel, QC, Evidence, Recheck)
│   ├── services/            # Business logic (ExpectedModelService, ObservedModelService, QCService, EvidenceService, RecheckService)
│   ├── cv/                  # CV preprocessing, YOLO adapter, spatial analysis
│   ├── ocr/                 # OCR engine interface & Tesseract adapter
│   ├── parsers/             # GA PDF & Excel wire list reference parsers
│   └── qc/                  # Matching engine & modular QC rules suite
├── tests/
│   └── test_*.py            # Pytest unit & regression test suite (38 tests)
├── requirements.txt         # Backend dependencies
└── README.md
```

---

## 2. Environment Configuration

Copy `.env.example` to `.env` or set environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `EAGLE EYE Backend` | Application display name |
| `APP_ENV` | `development` | Environment mode (`development` / `production`) |
| `LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `HOST` | `0.0.0.0` | Bind host address |
| `PORT` | `8000` | Bind port number |
| `DATABASE_URL` | `sqlite:///./eagle_eye.db` | SQLAlchemy connection string |
| `STORAGE_DIR` | `./storage` | Directory for uploaded photos & crops |
| `MODEL_DIR` | `./models/weights` | Directory for YOLO weights |
| `MAX_UPLOAD_SIZE_MB` | `50` | Maximum upload size limit |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins for frontend |

---

## 3. How to Start FastAPI

From the project root directory:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 4. Key API Endpoints

### `GET /health`
Returns system operational status and metadata.

### `POST /engineering/parse`
Parses GA PDF drawing and Excel Wire List spreadsheet into a normalized `ExpectedCabinetModel`.

### `POST /vision/inspect-image`
Processes a cabinet photograph into a structured `ObservedCabinetModel` with image quality assessment.

### `POST /qc/evaluate`
Compares `ExpectedCabinetModel` against `ObservedCabinetModel` using multi-signal matching and modular engineering QC rules. Returns `PASS`, `FAIL`, or `REVIEW` with structured issue reports.

### `POST /evidence/generate`
Generates master annotated image, 25% padded defect crops, and synthetic evidence cards for all FAIL/REVIEW issues.

### `POST /inspections`
Persists an inspection result, expected model, observed model, and issues to SQLite as an immutable historical record.

### `GET /inspections`
Lists all persisted inspection history records in reverse chronological order.

### `POST /inspections/{previous_inspection_id}/recheck`
Runs QC evaluation on a new re-check observation, generates evidence, and compares it against a selected previous inspection. Identifies `RESOLVED`, `STILL_OPEN`, and `NEW` issues.

### `GET /rechecks/{comparison_id}`
Retrieves a stored re-check comparison result by `comparison_id`.

---

## 5. How to Run Tests

From the project root directory:

```bash
pytest backend/tests
```
